import { _post } from '../server/request';

// 提交意见反馈（userId 后端从 JWT 取）
export function addFeedback(data) {
  return _post({
    url: `/api/wechat/feedback`,
    data,
  });
}
