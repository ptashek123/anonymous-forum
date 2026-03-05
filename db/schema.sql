--
-- PostgreSQL database dump
--

\restrict 1pOdE0YCjogWf4qoauaOpLqOv13fg5VZoScGCiYiCLT4zxnVF5Gn8D29ES8WjRb

-- Dumped from database version 17.9 (Homebrew)
-- Dumped by pg_dump version 18.2

-- Started on 2026-03-05 22:26:14 MSK

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 222 (class 1259 OID 16475)
-- Name: attachments; Type: TABLE; Schema: public; Owner: ptashko
--

CREATE TABLE public.attachments (
    id bigint NOT NULL,
    post_id bigint NOT NULL,
    file_path character varying(512) NOT NULL,
    thumbnail_path character varying(512),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.attachments OWNER TO ptashko;

--
-- TOC entry 221 (class 1259 OID 16474)
-- Name: attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: ptashko
--

CREATE SEQUENCE public.attachments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.attachments_id_seq OWNER TO ptashko;

--
-- TOC entry 3875 (class 0 OID 0)
-- Dependencies: 221
-- Name: attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ptashko
--

ALTER SEQUENCE public.attachments_id_seq OWNED BY public.attachments.id;


--
-- TOC entry 224 (class 1259 OID 16490)
-- Name: bans; Type: TABLE; Schema: public; Owner: ptashko
--

CREATE TABLE public.bans (
    id bigint NOT NULL,
    ip_address inet NOT NULL,
    reason text,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bans OWNER TO ptashko;

--
-- TOC entry 223 (class 1259 OID 16489)
-- Name: bans_id_seq; Type: SEQUENCE; Schema: public; Owner: ptashko
--

CREATE SEQUENCE public.bans_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bans_id_seq OWNER TO ptashko;

--
-- TOC entry 3876 (class 0 OID 0)
-- Dependencies: 223
-- Name: bans_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ptashko
--

ALTER SEQUENCE public.bans_id_seq OWNED BY public.bans.id;


--
-- TOC entry 220 (class 1259 OID 16456)
-- Name: posts; Type: TABLE; Schema: public; Owner: ptashko
--

CREATE TABLE public.posts (
    id bigint NOT NULL,
    thread_id bigint NOT NULL,
    content text NOT NULL,
    author_name character varying(50) DEFAULT 'Anonymous'::character varying NOT NULL,
    tripcode character varying(64),
    ip_address inet NOT NULL,
    is_op boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.posts OWNER TO ptashko;

--
-- TOC entry 219 (class 1259 OID 16455)
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: ptashko
--

CREATE SEQUENCE public.posts_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.posts_id_seq OWNER TO ptashko;

--
-- TOC entry 3877 (class 0 OID 0)
-- Dependencies: 219
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ptashko
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- TOC entry 218 (class 1259 OID 16446)
-- Name: threads; Type: TABLE; Schema: public; Owner: ptashko
--

CREATE TABLE public.threads (
    id bigint NOT NULL,
    subject character varying(255) DEFAULT ''::character varying NOT NULL,
    last_bump timestamp with time zone DEFAULT now(),
    views_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.threads OWNER TO ptashko;

--
-- TOC entry 3878 (class 0 OID 0)
-- Dependencies: 218
-- Name: COLUMN threads.views_count; Type: COMMENT; Schema: public; Owner: ptashko
--

COMMENT ON COLUMN public.threads.views_count IS 'Количество просмотров темы (для аналитики)';


--
-- TOC entry 217 (class 1259 OID 16445)
-- Name: threads_id_seq; Type: SEQUENCE; Schema: public; Owner: ptashko
--

CREATE SEQUENCE public.threads_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.threads_id_seq OWNER TO ptashko;

--
-- TOC entry 3879 (class 0 OID 0)
-- Dependencies: 217
-- Name: threads_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: ptashko
--

ALTER SEQUENCE public.threads_id_seq OWNED BY public.threads.id;


--
-- TOC entry 3703 (class 2604 OID 16478)
-- Name: attachments id; Type: DEFAULT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.attachments ALTER COLUMN id SET DEFAULT nextval('public.attachments_id_seq'::regclass);


--
-- TOC entry 3705 (class 2604 OID 16493)
-- Name: bans id; Type: DEFAULT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.bans ALTER COLUMN id SET DEFAULT nextval('public.bans_id_seq'::regclass);


--
-- TOC entry 3699 (class 2604 OID 16459)
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- TOC entry 3695 (class 2604 OID 16449)
-- Name: threads id; Type: DEFAULT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.threads ALTER COLUMN id SET DEFAULT nextval('public.threads_id_seq'::regclass);


--
-- TOC entry 3717 (class 2606 OID 16483)
-- Name: attachments attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);


--
-- TOC entry 3719 (class 2606 OID 16500)
-- Name: bans bans_ip_address_key; Type: CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.bans
    ADD CONSTRAINT bans_ip_address_key UNIQUE (ip_address);


--
-- TOC entry 3721 (class 2606 OID 16498)
-- Name: bans bans_pkey; Type: CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.bans
    ADD CONSTRAINT bans_pkey PRIMARY KEY (id);


--
-- TOC entry 3715 (class 2606 OID 16466)
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- TOC entry 3709 (class 2606 OID 16453)
-- Name: threads threads_pkey; Type: CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.threads
    ADD CONSTRAINT threads_pkey PRIMARY KEY (id);


--
-- TOC entry 3722 (class 1259 OID 16501)
-- Name: idx_bans_ip_expires; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_bans_ip_expires ON public.bans USING btree (ip_address, expires_at);


--
-- TOC entry 3710 (class 1259 OID 16473)
-- Name: idx_posts_ip_address; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_posts_ip_address ON public.posts USING btree (ip_address);


--
-- TOC entry 3711 (class 1259 OID 16472)
-- Name: idx_posts_thread_id; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_posts_thread_id ON public.posts USING btree (thread_id);


--
-- TOC entry 3712 (class 1259 OID 16503)
-- Name: idx_posts_tripcode; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_posts_tripcode ON public.posts USING btree (tripcode);


--
-- TOC entry 3880 (class 0 OID 0)
-- Dependencies: 3712
-- Name: INDEX idx_posts_tripcode; Type: COMMENT; Schema: public; Owner: ptashko
--

COMMENT ON INDEX public.idx_posts_tripcode IS 'Ускоряет поиск сообщений по трипкоду пользователя';


--
-- TOC entry 3713 (class 1259 OID 16504)
-- Name: idx_posts_tripcode_created; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_posts_tripcode_created ON public.posts USING btree (tripcode, created_at DESC);


--
-- TOC entry 3881 (class 0 OID 0)
-- Dependencies: 3713
-- Name: INDEX idx_posts_tripcode_created; Type: COMMENT; Schema: public; Owner: ptashko
--

COMMENT ON INDEX public.idx_posts_tripcode_created IS 'Ускоряет получение истории сообщений по трипкоду';


--
-- TOC entry 3707 (class 1259 OID 16454)
-- Name: idx_threads_last_bump; Type: INDEX; Schema: public; Owner: ptashko
--

CREATE INDEX idx_threads_last_bump ON public.threads USING btree (last_bump DESC);


--
-- TOC entry 3724 (class 2606 OID 16484)
-- Name: attachments attachments_post_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.attachments
    ADD CONSTRAINT attachments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- TOC entry 3723 (class 2606 OID 16467)
-- Name: posts posts_thread_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: ptashko
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_thread_id_fkey FOREIGN KEY (thread_id) REFERENCES public.threads(id) ON DELETE CASCADE;


-- Completed on 2026-03-05 22:26:14 MSK

--
-- PostgreSQL database dump complete
--

\unrestrict 1pOdE0YCjogWf4qoauaOpLqOv13fg5VZoScGCiYiCLT4zxnVF5Gn8D29ES8WjRb

