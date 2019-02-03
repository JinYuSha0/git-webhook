import * as http from 'http'
import * as EventEmitter from 'events'
import * as crypto from 'crypto'

interface IConfig {
  readonly path: string,
  readonly secret: string,
  readonly callback?: Function,
}

interface IEmitData {
  event: string,
  id: string,
  payload: Object,
  headers: http.IncomingHttpHeaders,
}

class GitWebHook extends EventEmitter {
  private readonly server: http.Server
  private readonly config: IConfig
  constructor(config: IConfig, server?: http.Server, port: number = 8001, listeningListener?: Function) {
    super()
    this.config = config
    if (server) {
      this.server = server
    } else {
      this.server = http.createServer()
      this.server.listen(port, listeningListener || function () {
        console.log(`Server listening port ${port}`)
      })
      this.server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
        function timeout() {
          res.writeHead(400)
          res.end('Can\'t not handle this')
        }
        setTimeout(timeout, 3000)
      })
    }
    this.handler(this.server, config)
  }
  public handler(server: http.Server, config: IConfig): void {
    server.on('request', async function (req: http.IncomingMessage, res: http.ServerResponse) {
      const hasCb = !!config.callback, cb = hasCb ? config.callback(req, res) : undefined
      if (req.url.split('?').shift() !== config.path || req.method !== 'POST') {
        return hasCb && cb(new Error('No such location'))
      }
      let hasError = function (msg: string): void {
        res.writeHead(400, {'content-type': 'application/json'})
        res.end(JSON.stringify({error: msg}))
        const err = new Error(msg)
        this.emit('error', err, req)
        return hasCb && cb(err)
      }
      hasError = hasError.bind(this)
      const sig = req.headers['x-hub-signature']
        , event = req.headers['x-github-event']
        , id    = req.headers['x-github-delivery']
      if (!sig) {
        return hasError('No X-Hub-Signature found on request')
      }
      if (!event) {
        return hasError('No X-Hub-Event found on request')
      }
      if (!id) {
        return hasError('No X-Github-Delivery found on request')
      }
      const body = await this.parseBody(req)
      if (!this.verify(<string>sig, body)) {
        return hasError('X-Hub-Signature verify failure')
      }
      let obj: object
      try {
        obj = JSON.parse(body)
      } catch (e) {
        hasError(e)
      }
      const emitData = {
          event
        , id
        , payload: obj
        , headers: req.headers
      }
      this.emit(<string>event, emitData)
      this.emit('*', emitData)
    }.bind(this))
  }
  public sign (data: string) {
    return 'sha1=' + crypto.createHmac('sha1', this.config.secret).update(data).digest('hex')
  }
  public verify (signature: string, data: string) {
    return Buffer.from(signature).equals(Buffer.from(this.sign(data)))
  }
  public parseBody (req: http.IncomingMessage) {
    let body = ''
    return new Promise<string>((resolve, reject) => {
      req.on('data', function (chunk) {
        body += chunk
      })
      req.on('end', function () {
        resolve(body)
      })
    })
  }
}

const gitWebHook: GitWebHook = new GitWebHook({ path: '/', secret: 'sjy96816' })
gitWebHook.on('push', (emitData: IEmitData) => {
  console.log('push', emitData.payload)
})
gitWebHook.on('error', (err: Error, req: http.IncomingMessage) => {
  console.log('error', err)
})
