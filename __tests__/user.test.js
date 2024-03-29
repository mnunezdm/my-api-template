import User from '../src/models/user.js';

import pg from 'pg';
import { jest } from '@jest/globals';

const resetMocks = () => {
  jest.clearAllMocks();
};

jest.mock('pg', () => ({
  Client: jest.fn(() => ({
    query: jest.fn(),
  })),
}));

describe('user tests (mocked db)', () => {
  it('deleted id field', () => {
    expect.assertions(2);
    const user = new User();
    expect(user.insertFields).not.toContain('id');
    expect(user.insertFields.length).toBeLessThan(
      Object.keys(User.fields).length,
    );
  });

  it('generate insert query', () => {
    expect.assertions(3);
    const user = new User();
    expect(user.insertQuery).toHaveLength(2);
    expect(user.insertQuery[0]).toContain('INSERT INTO');
    expect(user.insertQuery[1]).not.toHaveLength(0);
  });

  it('insert user', async () => {
    expect.assertions(1);
    let client = new pg.Client();
    client.query = jest.fn().mockResolvedValueOnce({ rows: [{ id: 1 }] });
    const user = new User();
    user.username = 'test_user';
    user.password = '123456';
    await expect(user.create(client)).resolves.toHaveProperty('id', 1);
    resetMocks();
  });

  it('insert user with id', async () => {
    expect.assertions(1);
    const user = new User();
    user.username = 'test_user';
    user.password = '123456';
    user.id = 1;
    await expect(user.create()).rejects.toThrow('INSERTED_USER_ERROR');
  });

  it('query user with id', async () => {
    expect.assertions(1);
    let client = new pg.Client();
    client.query = jest
      .fn()
      .mockResolvedValueOnce(
        Promise.resolve({ rows: [{ id: 1, username: 'test' }] }),
      );
    await expect(User.getById(1, client)).resolves.toHaveProperty(
      'constructor',
      User,
    );
    resetMocks();
  });

  it('query user with username', async () => {
    expect.assertions(1);
    let client = new pg.Client();
    client.query = jest
      .fn()
      .mockResolvedValueOnce(
        Promise.resolve({ rows: [{ id: 1, username: 'test' }] }),
      );
    await expect(User.getByUsername(1, client)).resolves.toHaveProperty(
      'constructor',
      User,
    );
    resetMocks();
  });

  it('query user with username not found', async () => {
    expect.assertions(1);
    let client = new pg.Client();
    client.query = jest
      .fn()
      .mockResolvedValueOnce(Promise.resolve({ rows: [], rowCount: 0 }));

    await expect(User.getByUsername(1, client)).rejects.toThrow(
      'USER_NOT_FOUND',
    );

    resetMocks();
  });

  it('check password invalid', async () => {
    expect.assertions(1);
    let client = new pg.Client();
    client.query = jest.fn().mockResolvedValueOnce({
      rows: [{ id: 1, username: 'test', password: 'invalid' }],
    });
    const user = await User.getByUsername(1, client);

    await expect(user.checkPassword('notthepass')).rejects.toThrow(
      'INVALID_PASSWORD',
    );
    resetMocks();
  });

  it('check password valid', async () => {
    expect.assertions(1);
    const password = 'valid';
    const hashedPassword = await User.hashPassword(password);
    let client = new pg.Client();
    client.query = jest.fn().mockResolvedValueOnce({
      rows: [{ id: 1, username: 'test', password: hashedPassword }],
    });
    const user = await User.getByUsername(1, client);

    await expect(user.checkPassword(password)).resolves.toBeUndefined();
    resetMocks();
  });
});
