> This repo serves to reproduce a bug with `@fastify/static` that  when used with
> `@autotelic/fastify-opentelemetry` produces a `FST_ERR_REP_ALREADY_SENT` error.

## Set up

```bash
$ git clone https://github.com/10xLaCroixDrinker/fastify-static-issue.git
$ cd fastify-static-issue
$ npm install
$ npm start
```

## To reproduce

Visit `http://127.0.0.1:3000/_/static/hello.js` in your browser. You'll see an empty response and the following log:

```
[18:56:05.356] WARN (91199): Reply was already sent, did you forget to "return reply" in "/_/static/hello.js" (GET)?
    reqId: "req-1"
    err: {
      "type": "FastifyError",
      "message": "Reply was already sent, did you forget to \"return reply\" in \"/_/static/hello.js\" (GET)?",
      "stack":
          FastifyError: Reply was already sent, did you forget to "return reply" in "/_/static/hello.js" (GET)?
              at Reply.send (~/git/fastify-static-issue/node_modules/fastify/lib/reply.js:151:26)
              at err (~/git/fastify-static-issue/node_modules/@opentelemetry/instrumentation-fastify/build/src/instrumentation.js:151:37)
              at safeExecuteInTheMiddle (~/git/fastify-static-issue/node_modules/@opentelemetry/instrumentation/build/src/utils.js:28:18)
              at _Reply.send (~/git/fastify-static-issue/node_modules/@opentelemetry/instrumentation-fastify/build/src/instrumentation.js:150:69)
              at PassThrough.<anonymous> (~/git/fastify-static-issue/node_modules/@fastify/static/index.js:265:15)
              at PassThrough.emit (node:events:514:28)
              at Readable.pipe (node:internal/streams/readable:1031:8)
              at SendStream.stream (~/git/fastify-static-issue/node_modules/@fastify/send/lib/SendStream.js:797:10)
              at SendStream.send (~/git/fastify-static-issue/node_modules/@fastify/send/lib/SendStream.js:708:8)
              at onstat (~/git/fastify-static-issue/node_modules/@fastify/send/lib/SendStream.js:730:10)
      "code": "FST_ERR_REP_ALREADY_SENT",
      "name": "FastifyError",
      "statusCode": 500
    }
```

## Resolution

Changing [these lines](https://github.com/fastify/fastify-static/blob/v7.0.0/index.js#L118-L120) in `@fastify/static` resolves the issue.

```diff
       fastify.get(prefix + '*', routeOpts, function (req, reply) {
         pumpSendToReply(req, reply, '/' + req.params['*'], sendOptions.root)
+        return reply
       })
```

This specifically happens when `@autotelic/fastify-opentelemetry` wraps the routes. I tried this change in the [`wrapRoute` function](https://github.com/autotelic/fastify-opentelemetry/blob/v0.18.0/index.js#L143-L148).

```diff
     function wrapRoute (routeHandler) {
-      return async function (request, ...args) {
+      return async function (request, reply, ...args) {
         const reqContext = getContext(request)
-        return context.with(reqContext, routeHandler.bind(this, request, ...args))
+        context.with(reqContext, routeHandler.bind(this, request, reply, ...args))
+        return reply
       }
     }
```

But doing so caused handlers that returned a body instead of calling `reply.send` to fail.

```js
fastify.get('/foo', async () => ({ bar: 'baz' }));
```
