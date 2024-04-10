SET check_function_bodies = false;
CREATE FUNCTION public.set_current_timestamp_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$;
CREATE TABLE public.audit_entries (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    description text NOT NULL,
    "user" uuid
);
CREATE SEQUENCE public.audit_entries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
ALTER SEQUENCE public.audit_entries_id_seq OWNED BY public.audit_entries.id;
CREATE TABLE public.item_ownership (
    user_id text NOT NULL,
    item_id uuid NOT NULL,
    quantity integer NOT NULL
);
CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    categories text[] NOT NULL,
    stock_available integer DEFAULT 0 NOT NULL,
    stock_reserved integer DEFAULT 0 NOT NULL,
    stock_minimum integer DEFAULT 0 NOT NULL,
    purchase_locations jsonb DEFAULT json_build_array() NOT NULL
);
CREATE TABLE public.order_states (
    "ORDER_STATE" text NOT NULL
);
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    item_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    count integer NOT NULL,
    total_cost integer,
    order_state text DEFAULT 'CREATED'::text NOT NULL
);
CREATE TABLE public.users (
    username text NOT NULL,
    admin boolean NOT NULL
);
ALTER TABLE ONLY public.audit_entries ALTER COLUMN id SET DEFAULT nextval('public.audit_entries_id_seq'::regclass);
ALTER TABLE ONLY public.audit_entries
    ADD CONSTRAINT audit_entries_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.item_ownership
    ADD CONSTRAINT item_ownership_pkey PRIMARY KEY (item_id, user_id);
ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_states
    ADD CONSTRAINT order_states_pkey PRIMARY KEY ("ORDER_STATE");
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (username);
CREATE TRIGGER set_public_items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.set_current_timestamp_updated_at();
COMMENT ON TRIGGER set_public_items_updated_at ON public.items IS 'trigger to set value of column "updated_at" to current timestamp on row update';
ALTER TABLE ONLY public.item_ownership
    ADD CONSTRAINT item_ownership_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.item_ownership
    ADD CONSTRAINT item_ownership_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(username) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON UPDATE RESTRICT ON DELETE CASCADE;
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_state_fkey FOREIGN KEY (order_state) REFERENCES public.order_states("ORDER_STATE") ON UPDATE CASCADE ON DELETE RESTRICT;
