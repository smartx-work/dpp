const ijest = require('ijest')
const http = require('http')
const querystring = require('querystring')

ijest({
    before (context) {
        context.dpp.defaults.baseURL = 'http://127.0.0.1:4444/'
        context.server = http.createServer(function (req, res) {
            const outJSON = (data) => res.end(JSON.stringify(data == null ? {} : data))
            const params = querystring.parse(req.url.match(/^[^?]*\?(.*)/)[1])
            switch (params.cmd) {
                case 'http200': {
                    return outJSON(params)
                }
                case 'http404': {
                    res.statusCode = 404
                    return res.end()
                }
                case 'http999': {
                    return
                }
                default: {
                    console.error(`unhandle request ${JSON.stringify(params)}`)
                }
            }
        }).listen(4444)
    },
    after (context) {
        context.server.close()
    },
    context: {
        dpp: require('../lib/'),
        adapter: require('@smartx/adapter'),
        ...require('./httpOption'),
        ...require('fly-utils'),
    },
    tests: {
        defaultConfig: require('./children/configs/defaultConfig'),
        globalConfig: require('./children/configs/globalConfig'),
        shareConfig: require('./children/configs/shareConfig'),
        privateConfig: require('./children/configs/privateConfig'),
        apiArgs: require('./children/apiArgs'),
        handles: require('./children/handles'),
        RESTful: require('./children/RESTful'),
        example: require('./children/example'),
    },
})
