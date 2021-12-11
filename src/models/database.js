import pg from 'pg';

const PgPool = pg.Pool;

export class Pool extends PgPool {
  get connected() {
    return Boolean(
      this._clients.filter(client => client._connected || client._connecting)
        .length,
    );
  }
}
