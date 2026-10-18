import { addFeedback } from '../../api/feedback';
import { uploadFile } from '../../api/public';
import { listDictItems } from '../../api/dict';

const MAX_IMAGE_COUNT = 4;

// 字典不可用时的兜底选项，与后端预置的 feedback_type 字典保持一致
const DEFAULT_TYPE_OPTIONS = [
  { label: '功能异常', value: 'bug' },
  { label: '产品建议', value: 'advice' },
  { label: '其他', value: 'other' },
];

function getInputValue(e) {
  if (e && e.detail && typeof e.detail === 'object' && Object.prototype.hasOwnProperty.call(e.detail, 'value')) {
    return e.detail.value;
  }
  return e ? e.detail : '';
}

Page({
  data: {
    titleProps: {
      title: '意见反馈',
    },
    typeOptions: [],
    form: {
      type: '',
      content: '',
      contact: '',
    },
    images: [],
    uploading: false,
    submitting: false,
  },

  onLoad() {
    if (!wx.getStorageSync('token')) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      setTimeout(() => wx.redirectTo({ url: '/pages/login/index' }), 600);
      return;
    }
    this.fillUserContact();
    this.fetchTypeOptions();
  },

  // 个人主体小程序拿不到微信手机号，仅回填用户资料里手填过的手机号
  fillUserContact() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.mobile) {
      this.setData({
        'form.contact': userInfo.mobile,
      });
    }
  },

  async fetchTypeOptions() {
    try {
      const res = await listDictItems('feedback_type');
      if (res && res.success && Array.isArray(res.data) && res.data.length) {
        this.setData({
          typeOptions: res.data.map((it) => ({ label: it.label, value: it.value })),
        });
        return;
      }
    } catch (err) {
      // 静默失败，使用兜底选项
    }
    this.setData({ typeOptions: DEFAULT_TYPE_OPTIONS });
  },

  onTypeChange(e) {
    this.setData({ 'form.type': e.detail.value });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: getInputValue(e),
    });
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: '/pages/home/index' });
  },

  async chooseImages() {
    if (this.data.uploading) return;
    const remain = MAX_IMAGE_COUNT - this.data.images.length;
    if (remain <= 0) {
      wx.showToast({ title: `最多上传${MAX_IMAGE_COUNT}张`, icon: 'none' });
      return;
    }

    try {
      const chooseRes = await wx.chooseMedia({
        count: remain,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
      });
      const files = chooseRes.tempFiles || [];
      if (!files.length) return;

      this.setData({ uploading: true });
      const uploaded = [];
      for (const file of files) {
        const res = await uploadFile(file.tempFilePath);
        if (res && res.success !== false && res.data && res.data.id) {
          uploaded.push({
            id: res.data.id,
            url: res.data.url,
          });
        }
      }
      if (uploaded.length) {
        this.setData({
          images: this.data.images.concat(uploaded),
        });
      }
    } catch (err) {
      if (!err || err.errMsg !== 'chooseMedia:fail cancel') {
        wx.showToast({ title: '图片上传失败', icon: 'none' });
      }
    } finally {
      this.setData({ uploading: false });
    }
  },

  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.images.slice();
    images.splice(index, 1);
    this.setData({ images });
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const urls = this.data.images.map((item) => item.url);
    wx.previewImage({
      current: urls[index],
      urls,
    });
  },

  validateForm() {
    const { form } = this.data;
    const phoneReg = /^1\d{10}$|^\d{7,20}$/;

    if (!form.type) {
      return '请选择反馈类型';
    }
    const content = form.content.trim();
    if (content.length < 10) {
      return '反馈内容至少输入10个字';
    }
    if (content.length > 500) {
      return '反馈内容不能超过500个字';
    }
    if (form.contact.trim() && !phoneReg.test(form.contact.trim())) {
      return '请输入正确的联系方式';
    }
    return '';
  },

  buildPayload() {
    const { form, images } = this.data;
    return {
      type: form.type,
      content: form.content.trim(),
      contact: form.contact.trim(),
      images: images.map((item) => ({ id: item.id, url: item.url })),
    };
  },

  async submitForm() {
    if (this.data.submitting || this.data.uploading) return;
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const res = await addFeedback(this.buildPayload());
      if (res && res.success !== false) {
        wx.showToast({ title: '提交成功', icon: 'success' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      }
    } catch (err) {
      wx.showToast({ title: '提交失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
