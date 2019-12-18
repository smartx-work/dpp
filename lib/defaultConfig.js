const axiosGlobal = {
    baseURL: '', // 接口基础地址
    timeout: 5000, // 超时时间 默认5000
    responseType: 'json', // 默认响应数据类型
    withCredentials: false, // 当前请求为跨域类型时是否在请求中协带cookie
    headers: { 'Content-Type': 'application/json' }, // 默认请求数据类型
}
const axiosShare = {
    url: '',
    method: 'get',
    timeout: null,
    headers: {},
}

const ippGlobal = {

}

const ippShare = {
    name: null,
    delay: 0, // 延迟响应
    mock: null, // mock数据
    mockData: null, // mock响应数据
}

module.exports = {
    defaults: {
        ...axiosGlobal,
        ...ippGlobal,
        headers: {
            ...axiosGlobal.headers,
            ...ippGlobal.headers,
        },
    },
    globals: {
        axios: axiosGlobal,
        dpp: ippGlobal,
    },
    shares: {
        axios: axiosShare,
        dpp: ippShare,
    },
}
