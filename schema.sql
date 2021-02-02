CREATE TABLE user_ (
  id SERIAL PRIMARY KEY,
  username VARCHAR (32) NOT NULL UNIQUE,
  password VARCHAR (256) NOT NULL,
  first_name VARCHAR (64),
  last_name VARCHAR (64)
);

CREATE INDEX username ON user_(username);

CREATE TABLE session (
  sid varchar NOT NULL COLLATE "default",
  sess json NOT NULL,
  expire timestamp(6) NOT NULL,
  CONSTRAINT "session_pkey" PRIMARY KEY ("sid")
);
CREATE INDEX "IDX_session_expire" ON session ("expire");