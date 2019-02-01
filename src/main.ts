import * as http from 'http'
import * as EventEmitter from 'events'

class GitWebHook extends EventEmitter {
  private server: http.Server
  constructor(server?: http.Server, port: number = 80, listeningListener?: Function) {
    super()
    if (server) {
      this.server = server
    } else {
      this.server = http.createServer()
      this.server.listen(port, listeningListener || function () {
        console.log(`Server listening port ${port}`)
      })
    }
    this.server.on('request', (req: http.IncomingMessage, res: http.ServerResponse) => {
      console.log(req.method, req.headers)
      res.writeHead(200)
      res.end(`Hello GitWebHook`)
    })
  }
}

const gitWebHook: GitWebHook = new GitWebHook()
