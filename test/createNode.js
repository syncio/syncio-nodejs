import test from 'ava'
import { createNode } from '../'

test('Api', async t => {
    const server = createNode()
    const client = createNode()

    client.open(server.message, (a, b, req) => {
        t.is(a, 2)
        t.is(b, 5)
        t.true(req instanceof Promise)
        t.deepEqual(Object.keys(req).length, 3)
        t.is(req.node, client)
        t.is(typeof req.resolve, 'function')
        t.is(typeof req.reject, 'function')
    })
    const callClient = server.open(client.message)
    const promise = callClient(2, 5)

    t.deepEqual(Object.keys(server).length, 6)

    t.deepEqual(Object.keys(promise).length, 5)
    t.true(promise instanceof Promise)
    t.is(server.send, client.message)
    t.is(promise.node, server)
    t.is(typeof promise.resolve, 'function')
    t.is(typeof promise.reject, 'function')
    t.is(typeof promise.createdAt, 'number')
})

test('Checking api req', async t => {
    const server = createNode()
    const client = createNode()
    server.open(client.message, (...args) => {
        t.is(args.length, 1)
        t.deepEqual(Object.keys(args[0]), ['resolve', 'reject', 'node'])
    })
    const callServer = client.open(server.message)
    callServer()
})

test('Callback pattern example', async t => {
    const server = createNode()
    const client = createNode()

    // server side
    server.open(client.message, (a, b, callback) => {
        callback(a * b)
    })

    // client side
    const callServer = client.open(server.message)
    callServer(3, 3, value => {
        t.is(value, 9)
    })
})

test('Calling a defined function .message must return true', async t => {
    const server = createNode()
    const client = createNode()
    const callClient = server.open(client.message, () => {})
    const callServer = client.open(msg => {
        t.is(server.message(msg), true)
    })
    callServer()
})

test('Calling a not defined function .message must return false', async t => {
    const server = createNode()
    const client = createNode()
    const callClient = server.open(client.message)
    const callServer = client.open(msg => {
        t.is(server.message(msg), false)
    })
    callServer()
})

test('Response (reject or resolve must delete request)', async t => {
    const server = createNode()
    const client = createNode()
    server.open(client.message, v => {})
    const callServer = client.open(server.message)
    t.is(Object.keys(client.requests).length, 0)
    callServer().then(v => {
        t.is(Object.keys(client.requests).length, 0)
    })
    t.is(Object.keys(client.requests).length, 1)
})

test('Passing same functions should not create a new one', async t => {
    const server = createNode()
    const client = createNode()

    // Client side
    const callServer = client.open(
        server.message,
        (repeated1, repeated2, callserverasargument) => {
            t.is(repeated1, repeated2)
            t.is(callServer, callserverasargument)
        }
    )

    // Server side
    const receiveFromClient = () => {}
    const repeated = () => {}
    const callClient = server.open(client.message, receiveFromClient)
    callClient(repeated, repeated, receiveFromClient)
})

test('Sending remote functions must be replaced as null', async t => {
    const server = createNode()
    const client = createNode()

    // server side
    server.open(client.message, (...args) => {
        t.is(args.length, 3)
        t.is(args[0], null)
        t.is(typeof args[1], 'function')
        t.is(typeof args[2], 'object')
        return args[1]
    })

    // client side
    const callServer = client.open(server.message)
    const resu = await callServer(callServer, () => {})
    t.is(resu, null)
})

test('Testing messages', async t => {
    const server = createNode()
    const client = createNode()

    client.open(
        msg => {
            t.deepEqual(msg, [-1, 0, 10])
            server.message(msg)
        },
        (a, b) => a * b
    )
    const callClient = server.open(msg => {
        t.deepEqual(msg, [1, 0, [2, 5]])
        client.message(msg)
    })
    const ten = await callClient(2, 5)
    t.is(ten, 10)
})

test('Escaping $f', async t => {
    const server = createNode()
    const client = createNode()

    // server side
    server.open(
        msg => {
            t.deepEqual(msg, [-1, 0, { $escape: { $f: 1 } }])
            client.message(msg)
        },
        arg => {
            t.deepEqual(arg, { $f: 0 })
            return { $f: 1 }
        }
    )

    // client side
    const callServer = client.open(msg => {
        t.deepEqual(msg, [1, 0, [{ $escape: { $f: 0 } }]])
        server.message(msg)
    })
    const resu = await callServer({ $f: 0 })
    t.deepEqual(resu, { $f: 1 })
})

test('Using resolve', async t => {
    const server = createNode()
    const client = createNode()
    server.open(client.message)
    t.is(Object.keys(client.requests).length, 0)
    const callServer = client.open(server.message)
    const req = callServer()
    t.is(Object.keys(client.requests).length, 1)
    req.then(value => {
        t.is(value, 'resolved')
    })
    req.resolve('resolved')
    t.is(Object.keys(client.requests).length, 0)
})

test('Using reject', async t => {
    const server = createNode()
    const client = createNode()
    server.open(client.message)
    t.is(Object.keys(client.requests).length, 0)
    const callServer = client.open(server.message)
    const req = callServer()
    t.is(Object.keys(client.requests).length, 1)
    req.catch(error => {
        t.is(error, 'rejected')
    })
    req.reject('rejected')
    t.is(Object.keys(client.requests).length, 0)
})

test('Using stub', async t => {
    const server = createNode()
    const client = createNode()
    server.open(client.message, (...args) => {
        t.is(args.length, 1)
        t.deepEqual(Object.keys(args[0]), ['node'])
    })
    const callServer = client.open(server.message)
    t.is(Object.keys(client.requests).length, 0)
    t.is(callServer.stub(), undefined)
    t.is(Object.keys(client.requests).length, 0)
})

test('Sending remote stub functions must be replaced as null', async t => {
    const server = createNode()
    const client = createNode()

    // server side
    server.open(client.message, (...args) => {
        t.is(args.length, 3)
        t.is(args[0], null)
        t.is(typeof args[1], 'function')
        t.is(typeof args[2], 'object')
        return args[1]
    })

    // client side
    const callServer = client.open(server.message)
    const resu = await callServer(callServer.stub, () => {})
    t.is(resu, null)
})
