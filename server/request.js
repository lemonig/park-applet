import { contentType, messageName, statusName, successCode } from '../config/index.js';
import {getUrl} from './getUrlByEnv'
import { isArray } from '../utils/validate.js';
 const baseURL = getUrl();
//  const baseURL = 'https://wx.greandata1.com/test';

let loadingInstance = null;

// 操作正常Code数组
const codeVerificationArray = isArray(successCode) ? [...successCode] : [...[successCode]];

const CODE_MESSAGE = {
  200: '服务器成功返回请求数据',
  201: '新建或修改数据成功',
  202: '一个请求已经进入后台排队(异步任务)',
  204: '删除数据成功',
  400: '发出信息有误',
  401: '用户没有权限(令牌失效、用户名、密码错误、登录过期)',
  402: '令牌过期',
  403: '用户得到授权，但是访问是被禁止的',
  404: '访问资源不存在',
  406: '请求格式不可得',
  410: '请求资源被永久删除，且不会被看到',
  500: '服务器发生错误',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时',
};

const request = ({ url, method, data, header, retried = false }) => {
    const startTime = new Date().getTime();
  //  原始请求体（success 回调里 data 会被响应体覆盖，重试需用它）
  const requestData = data;
  //  加载请求拦截器
  //  token
  const token = wx.getStorageSync('token');
  const dataType = wx.getStorageSync('dataType');
  const requestHeader = { ...header };
  if (token) {
    requestHeader['token'] = token;
    requestHeader['Authorization'] = `Bearer ${token}`;
    requestHeader['dataType'] = dataType || 0;
  }
  wx.showLoading({
    title: '请稍等...',
    mask: true,
  });
  return new Promise((resolve, reject) => {
    wx.request({
      url: baseURL + url,
      method,
      header: requestHeader,
      data,
      timeout: 30000,
      // enableHttp2:true,
      success({ data, statusCode, header: respHeader }) {
        // reportApiMonitorSuccess(url, data.code,startTime,data.message);
        wx.hideLoading();
        // 若data.code存在，覆盖默认code
        let code = data && data[statusName] ? data[statusName] : 9999;
        if (codeVerificationArray.indexOf(data[statusName]) + 1) code = 200;

        // 401 / UNAUTHENTICATED / code=401 → 登录失效
        const unauthorized = statusCode === 401
          || (data && data.error === 'UNAUTHENTICATED')
          || code === 401;

        if (unauthorized) {
          // 清除本地登录态
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          if (!retried) {
            // 静默重登：wx.login 换新 code → 后端 mini-login 换新 token，成功后重试原请求（仅重试一次）
            silentRelogin().then((ok) => {
              if (ok) {
                resolve(request({ url, method, data: requestData, header, retried: true }));
              } else {
                redirectToLogin();
                resolve(data);
              }
            }).catch(() => {
              redirectToLogin();
              resolve(data);
            });
          } else {
            // 已重试过一次仍 401 → 跳登录页
            redirectToLogin();
            resolve(data);
          }
          return;
        }

        // 自动续期：后端在剩余时长低于阈值时通过响应头 X-New-Token 下发新 token
        if (respHeader && respHeader['X-New-Token']) {
          wx.setStorageSync('token', respHeader['X-New-Token']);
          const userInfo = wx.getStorageSync('userInfo');
          if (userInfo) {
            userInfo.token = respHeader['X-New-Token'];
            wx.setStorageSync('userInfo', userInfo);
          }
        }

        switch (code) {
          case 200:
            //  请求成功
            resolve(data);
            break;

          default:
            //  请求异常
            if (data.error === "UNAUTHENTICATED") {
              //  登录失效处理
              redirectToLogin();
            }
            if(!data.success){
            const errMsg = `${
              data && data[messageName]
                ? data[messageName]
                : CODE_MESSAGE[code]
                ? CODE_MESSAGE[code]
                : '未知错误'
            }`;
            console.log(errMsg);

            wx.showToast({
              title: errMsg,
              icon: 'error',
              duration: 2000,
            });
          }

            return resolve(data);
        }
      },
      fail: function (err) {
        // reportApiMonitorFail(url,500 ,startTime, err);
        wx.hideLoading();

        // wx.showToast({
        //   title: err.message,
        //   icon: 'error',
        //   duration: 2000,
        // });
        reject(err);
      },
      complete() {
        console.log('request complete!')

      },
    });
  });
};

// 静默重登：wx.login 拿新 code → 调后端 mini-login 换新 token，成功写回本地
function silentRelogin() {
  return new Promise((resolve) => {
    wx.login({
      success: ({ code }) => {
        if (!code) {
          resolve(false);
          return;
        }
        wx.request({
          url: baseURL + '/api/wechat/auth/mini-login',
          method: 'POST',
          data: { code },
          header: { 'content-type': 'application/json' },
          timeout: 30000,
          success(resp) {
            const body = resp.data || {};
            if (resp.statusCode === 200 && body.code === 200 && body.data && body.data.token) {
              wx.setStorageSync('token', body.data.token);
              wx.setStorageSync('userInfo', body.data);
              resolve(true);
            } else {
              resolve(false);
            }
          },
          fail() {
            resolve(false);
          },
        });
      },
      fail() {
        resolve(false);
      },
    });
  });
}

// 跳转登录页
function redirectToLogin() {
  wx.redirectTo({
    url: '/pages/login/index',
  });
}

const _post = async ({
  url,
  data,
  header = {
    'content-type': 'application/json',
  },
}) => {
  let res = await request({
    // 'content-type': 'application/x-www-form-urlencoded'
    url,
    data,
    header,
    method: 'POST',
  });
  return res;
};
const _get = async ({
  url,
  data,
  header = {
    'content-type': 'application/json',
  },
}) => {
  let res = await request({
    // 'content-type': 'application/x-www-form-urlencoded'
    url,
    data,
    header,
    method: 'GET',
  });
  return res;
};

const _put = async ({
  url,
  data,
  header = {
    'content-type': 'application/json',
  },
}) => {
  let res = await request({
    url,
    data,
    header,
    method: 'PUT',
  });
  return res;
};

const _delete = async ({
  url,
  data,
  header = {
    'content-type': 'application/json',
  },
}) => {
  let res = await request({
    url,
    data,
    header,
    method: 'DELETE',
  });
  return res;
};

const _upload = async ({
    url,
    data,
    name = 'file',
    formData = {},
    header = {},
  }) => {
      const token = wx.getStorageSync('token');
      const uploadHeader = {
        ...header,
      };
      if (token) {
        uploadHeader.token = token;
        uploadHeader.Authorization = `Bearer ${token}`;
      }

      return new Promise((rso, rej) => {
        wx.uploadFile({
            url: baseURL + url,
            filePath: data,
            name,
            formData,
            header: uploadHeader,
            success: function (uploadRes) {
              let obj = {};
              try {
                obj = JSON.parse(uploadRes.data || '{}');
              } catch (error) {
                wx.showToast({ title: '上传响应异常', icon: 'none' });
                rej(error);
                return;
              }

              if (uploadRes.statusCode === 401 || obj.error === 'UNAUTHENTICATED' || obj.code === 401) {
                // 上传类请求不做自动重登重试（避免重复上传副作用），直接跳登录页
                wx.removeStorageSync('token');
                wx.removeStorageSync('userInfo');
                redirectToLogin();
                rej(obj);
                return;
              }

              if (uploadRes.statusCode < 200 || uploadRes.statusCode >= 300 || obj.success === false) {
                wx.showToast({
                  title: obj.message || CODE_MESSAGE[uploadRes.statusCode] || '上传失败',
                  icon: 'none',
                  duration: 2000,
                });
                rej(obj);
                return;
              }

              rso(obj);
            },
            fail: function (uploadError) {
              rej(uploadError);
            },
          });
      })
   
  };



// 在接口请求成功时上报接口监控数据
function reportApiMonitorSuccess(url, code,startTime,msg) {
    if(code == 200){
      code = 0
    }
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    wx.reportEvent('wxdata_perf_monitor', {
        "wxdata_perf_monitor_id": url,
        "wxdata_perf_monitor_level": 0,
        "wxdata_perf_error_code": code,
        "wxdata_perf_error_msg": msg,
        "wxdata_perf_cost_time": duration,
        "wxdata_perf_extra_info1": "",
        "wxdata_perf_extra_info2": "",
        "wxdata_perf_extra_info3": "",

    });
  }
  
  // 在接口请求失败时上报接口监控数据
  function reportApiMonitorFail(url, code,startTime, error) {
    const endTime = new Date().getTime();
    const duration = endTime - startTime;
    wx.reportEvent('wxdata_perf_monitor', {
      url: url,             
      status: 'fail',     
      duration: duration, 
      error: error     
    });
  }
  

  

module.exports = {
  request,
  _post,
  _get,
  _put,
  _delete,
  _upload,
  baseURL:baseURL
};
