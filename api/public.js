import {
  _post,
  _upload
} from "../server/request";


// 文件上传 
export function uploadFile(data) {
  return _post({
    url: `/api/cos/upload`,
    method: 'post',
    data
  })
}