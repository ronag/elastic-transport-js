/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { test } from 'tap'
import { inspect } from 'util'
import { URL } from 'url'
import { BaseConnection, Diagnostic, errors } from '../../'
const { ConfigurationError } = errors

test('get diagnostic instance', t => {
  const conn = new BaseConnection({ url: new URL('http://localhost:9200') })
  t.true(conn.diagnostic instanceof Diagnostic)
  t.end()
})

test('Connection id should not contain credentials', t => {
  const connection = new BaseConnection({
    url: new URL('http://user:password@localhost:9200')
  })
  t.strictEqual(connection.id, 'http://localhost:9200/')
  t.end()
})

test('configure ssl', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    ssl: { host: 'host' }
  })

  t.strictEqual(conn.ssl?.host, 'host')
  t.end()
})

test('configure id', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    id: 'id'
  })

  t.strictEqual(conn.id, 'id')
  t.end()
})

test('configure status', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    status: BaseConnection.statuses.DEAD
  })

  t.strictEqual(conn.status, BaseConnection.statuses.DEAD)
  t.end()
})

test('configure diagnostic', t => {
  const diagnostic = new Diagnostic()
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    diagnostic
  })

  t.true(conn.diagnostic === diagnostic)
  t.end()
})

test('get & set status', t => {
  const conn = new BaseConnection({ url: new URL('http://localhost:9200') })
  t.strictEqual(conn.status, BaseConnection.statuses.ALIVE)
  conn.status = BaseConnection.statuses.DEAD
  t.strictEqual(conn.status, BaseConnection.statuses.DEAD)

  try {
    conn.status = 'hello'
    t.fail('Should throw')
  } catch (err) {
    t.true(err instanceof ConfigurationError)
  }

  t.end()
})

test('Should throw if the protocol is not http or https', t => {
  try {
    new BaseConnection({ // eslint-disable-line
      url: new URL('nope://nope')
    })
    t.fail('Should throw')
  } catch (err) {
    t.ok(err instanceof ConfigurationError)
    t.is(err.message, 'Invalid protocol: \'nope:\'')
  }
  t.end()
})

test('Util.inspect Connection class should hide agent, ssl and auth', t => {
  t.plan(1)

  const connection = new BaseConnection({
    url: new URL('http://user:password@localhost:9200'),
    id: 'node-id',
    headers: { foo: 'bar' }
  })

  // Removes spaces and new lines because
  // utils.inspect is handled differently
  // between major versions of Node.js
  function cleanStr (str: string): string {
    return str
      .replace(/\s/g, '')
      .replace(/(\r\n|\n|\r)/gm, '')
  }

  t.strictEqual(cleanStr(inspect(connection)), cleanStr(`{ url: 'http://localhost:9200/',
  id: 'node-id',
  headers: { foo: 'bar' },
  status: 'alive'}`)
  )
})

test('connection.toJSON should hide agent, ssl and auth', t => {
  t.plan(1)

  const connection = new BaseConnection({
    url: new URL('http://user:password@localhost:9200'),
    id: 'node-id',
    headers: { foo: 'bar' }
  })

  t.deepEqual(connection.toJSON(), {
    url: 'http://localhost:9200/',
    id: 'node-id',
    headers: {
      foo: 'bar'
    },
    status: 'alive'
  })
})

test('configure basic authentication', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    auth: {
      username: 'user',
      password: 'pwd'
    }
  })
  t.deepEqual(conn.headers, {
    authorization: 'Basic dXNlcjpwd2Q='
  })
  t.end()
})

test('configure apiKey authentication as string', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    auth: {
      apiKey: 'key'
    }
  })
  t.deepEqual(conn.headers, {
    authorization: 'ApiKey key'
  })
  t.end()
})

test('configure apiKey authentication as object', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    auth: {
      apiKey: {
        id: 'id',
        api_key: 'api_key'
      }
    }
  })
  t.deepEqual(conn.headers, {
    authorization: 'ApiKey aWQ6YXBpX2tleQ=='
  })
  t.end()
})

test('do not override authentication', t => {
  const conn = new BaseConnection({
    url: new URL('http://localhost:9200'),
    headers: {
      authorization: 'hello world'
    },
    auth: {
      username: 'user',
      password: 'pwd'
    }
  })
  t.deepEqual(conn.headers, {
    authorization: 'hello world'
  })
  t.end()
})
