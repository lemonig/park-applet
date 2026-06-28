import {
  _upload
} from "../server/request";


// 文件上传 
export function uploadFile(data) {
  return _upload({
    url: `/api/cos/upload`,
    data
  })
}