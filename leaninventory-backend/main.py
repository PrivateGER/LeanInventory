import os
import time
from typing import Any

import jwt
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Body
from ldap3.core.exceptions import LDAPBindError
from starlette import status
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

from ldap3 import Server, Connection, ALL

app = FastAPI()

JWT_SECRET = os.environ["JWT_SECRET"]


def generate_system_jwt():
    return jwt.encode(payload={
        "sub": "system",
        "name": "system",
        "iat": int(time.time()),
        "iss": 'LeanInventory',
        "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["admin"],
            "x-hasura-user-id": "system",
            "x-hasura-default-role": "admin",
            "x-hasura-role": "admin"
        },
        "exp": int(time.time()) + 60 * 60
    }, algorithm="HS256", key=JWT_SECRET)


def verify_ldap_credentials(username, user_password):
    """
    Verifies a user's credentials against an LDAP server.

    :param username: The user ID to verify.
    :param user_password: The password of the user.
    :return: True if the credentials are verified; False otherwise.
    """
    server = Server(os.environ["LDAP_SERVER"], get_info=ALL)

    # First, bind as admin to the LDAP server
    try:
        admin_conn = Connection(server, os.environ["LDAP_ADMIN_DN"], os.environ["LDAP_ADMIN_PASSWORD"])
        if not admin_conn.bind():
            print("Admin bind failed.")
            return False
    except LDAPBindError as e:
        print(f"Admin bind exception: {e}")
        return False

    # Search for the user's DN
    admin_conn.search(os.environ["LDAP_USER_BASE_DN"], f'(sAMAccountName={username})', attributes=['distinguishedName'])

    if len(admin_conn.entries) != 1:
        print("User not found.")
        return False

    user_dn = admin_conn.entries[0].distinguishedName.value

    # attempt to re-bind with the user's credentials
    try:
        user_conn = Connection(server, user_dn, user_password)
        if user_conn.bind():
            print("User credentials verified.")
            return True
        else:
            print("User bind failed.")
            return False
    except LDAPBindError as e:
        print(f"User bind exception: {e}")
        return False
    finally:
        # Unbind the connections
        admin_conn.unbind()
        user_conn.unbind()


@app.post("/hasura/syncusers", tags=["auth"])
def sync_users():
    # Get all users from LDAP
    server = Server(os.environ["LDAP_SERVER"], get_info=ALL)

    try:
        admin_conn = Connection(server, os.environ["LDAP_ADMIN_DN"], os.environ["LDAP_ADMIN_PASSWORD"])
        if not admin_conn.bind():
            print("Admin bind failed.")
            return False
    except LDAPBindError as e:
        print(f"Admin bind exception: {e}")
        return False

    admin_conn.search(os.environ["LDAP_USER_BASE_DN"], '(objectClass=person)', attributes=['uid', 'sAMAccountName'])

    users = []
    for entry in admin_conn.entries:
        user = {
            "username": entry.sAMAccountName.value,
            "admin": False
        }

        users.append(user)

    counter = 0

    def label():
        nonlocal counter
        counter += 1
        return counter

    query = "mutation userSync {\n"
    for user in users:
        query += f'{label()}: insert_users(objects: {{username: "{user["username"]}", admin: {str(user["admin"]).lower()}}}, on_conflict: {{constraint: users_pkey, update_columns: admin}}) {{ returning {{ username }} }}\n'
    query += "}"

    query = gql(query)

    transport = AIOHTTPTransport(url="http://graphql-engine:8080/v1/graphql",
                                 headers={"Authorization": f"Bearer {generate_system_jwt()}"})

    client = Client(transport=transport, fetch_schema_from_transport=True)

    result = client.execute(query)
    print(result)

    # Return user list
    return result


@app.post("/auth/hasura", tags=["auth"])
async def hasura_login(
        payload: Any = Body(...),
):
    # Check if username and password are in the payload
    username = payload.get("username")
    password = payload.get("password")

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password must be provided",
        )

    # LDAP login returning a JWT token
    if not verify_ldap_credentials(username, password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    user_jwt = jwt.encode(payload={
        "sub": username,
        "name": username,
        "iat": int(time.time()),
        "iss": 'LeanInventory',
        "https://hasura.io/jwt/claims": {
            "x-hasura-allowed-roles": ["admin"],
            "x-hasura-user-id": username,
            "x-hasura-default-role": "admin",
            "x-hasura-role": "admin"
        },
        "exp": int(time.time()) + 86400
    }, algorithm="HS256", key=JWT_SECRET)

    return {"accessToken": user_jwt}
