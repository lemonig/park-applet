import { addMarket, updateMarket, detailMarket } from '../../api/market';
import { uploadFile } from '../../api/public';
import { listDictItems } from '../../api/dict';

const app = getApp();
const MAX_IMAGE_COUNT = 6;

function getInputValue(e) {
  if (e && e.detail && typeof e.detail === 'object' && Object.prototype.hasOwnProperty.call(e.detail, 'value')) {
    return e.detail.value;
  }
  return e ? e.detail : '';
}

Page({
  data: {
    titleProps: {
      title: '发布车位',
    },
    navBarHeight: app.globalData.navBarHeight || 0,
    type: 1,
    typeText: '出售',
    priceLabel: '出售价格',
    priceUnit: '元',
    isEdit: false,
    form: {
      parkingNo: '',
      price: '',
      phone: '',
      communityId: null,
      community: '',
      positionDesc: '',
      specs: '',
      description: '',
      buildings: [],
    },
    buildingOptions: [],
    images: [],
    uploading: false,
    submitting: false,
  },

  onLoad(options) {
    const type = Number(options.type);
    if (![1, 2].includes(type)) {
      wx.showToast({ title: '发布类型缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      return;
    }
    this.setType(type);

    const id = options.id;
    if (id) {
      this.editingId = id;
      this.setData({
        isEdit: true,
        'titleProps.title': type === 2 ? '编辑出租车位' : '编辑出售车位',
      });
      this.fetchDetail(id);
    } else {
      this.fillUserPhone();
      this.fetchBuildings();
    }
  },

  // 编辑态：拉取详情回填
  async fetchDetail(id) {
    try {
      const res = await detailMarket(id);
      const item = res && res.success !== false ? res.data : null;
      if (!item) {
        wx.showToast({ title: '获取车位信息失败', icon: 'none' });
        return;
      }
      const buildings = item.buildings ? String(item.buildings).split(',').map((v) => v.trim()).filter(Boolean) : [];
      this.setData({
        form: {
          parkingNo: item.parkingNo || '',
          price: item.price != null ? String(item.price) : '',
          phone: item.phone || '',
          communityId: item.communityId != null ? item.communityId : null,
          community: item.community || '',
          positionDesc: item.positionDesc || '',
          specs: item.specs || '',
          description: item.description || '',
          buildings,
        },
        images: (item.images || []).map((img) => ({ id: img.id, url: img.url })),
      });
      this.fetchBuildings();
    } catch (err) {
      wx.showToast({ title: '获取车位信息失败', icon: 'none' });
    }
  },

  async fetchBuildings() {
    try {
      const res = await listDictItems('ld_1');
      if (res && res.success && Array.isArray(res.data)) {
        const selected = this.data.form.buildings || [];
        const options = res.data.map((it) => ({
          ...it,
          selected: selected.indexOf(it.value) > -1,
        }));
        this.setData({ buildingOptions: options });
      }
    } catch (err) {
      // 静默失败，不影响表单
    }
  },

  /**
   * 小区选择：标的地址以小区库为唯一来源，填报人位置不参与地址生成。
   */
  onPickCommunity() {
    wx.navigateTo({
      url: '/pages/community-picker/index',
      events: {
        selectCommunity: (community) => {
          if (!community || !community.id) return;
          this.setData({
            'form.communityId': community.id,
            'form.community': community.name || '',
          });
        },
      },
    });
  },

  setType(type) {
    const isRent = Number(type) === 2;
    this.setData({
      type: isRent ? 2 : 1,
      typeText: isRent ? '出租' : '出售',
      priceLabel: isRent ? '月租金' : '出售价格',
      priceUnit: isRent ? '元/月' : '元',
      'titleProps.title': isRent ? '发布出租车位' : '发布出售车位',
    });
  },

  fillUserPhone() {
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo && userInfo.mobile) {
      this.setData({
        'form.phone': userInfo.mobile,
      });
    }
  },

  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack({ delta: 1 });
      return;
    }
    wx.switchTab({ url: '/pages/home/index' });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: getInputValue(e),
    });
  },

  onToggleBuilding(e) {
    const value = e.currentTarget.dataset.value;
    const list = (this.data.form.buildings || []).slice();
    const idx = list.indexOf(value);
    if (idx > -1) {
      list.splice(idx, 1);
    } else {
      if (list.length >= 3) {
        wx.showToast({ title: '最多选择3个楼栋', icon: 'none' });
        return;
      }
      list.push(value);
    }
    this.setData({ 'form.buildings': list });
    const options = this.data.buildingOptions.map((it) => ({
      ...it,
      selected: list.indexOf(it.value) > -1,
    }));
    this.setData({ buildingOptions: options });
  },

  validateForm() {
    const { form, type, priceLabel } = this.data;
    const priceReg = /^(?!0+(?:\.0{1,2})?$)\d{1,8}(\.\d{1,2})?$/;
    const phoneReg = /^1\d{10}$|^\d{7,20}$/;

    if (![1, 2].includes(type)) {
      return '请选择发布类型';
    }
    if (!form.parkingNo.trim()) {
      return '请输入车位编号';
    }
    if (form.parkingNo.trim().length > 50) {
      return '车位编号不能超过50个字符';
    }
    if (!String(form.price).trim()) {
      return `请输入${priceLabel}`;
    }
    if (!priceReg.test(String(form.price).trim())) {
      return '请输入正确价格，最多2位小数';
    }
    if (!String(form.phone).trim()) {
      return '请输入联系电话';
    }
    if (!phoneReg.test(String(form.phone).trim())) {
      return '请输入正确联系电话';
    }
    if (!form.communityId) {
      return '请选择车位所在小区';
    }
    if (form.description && form.description.length > 500) {
      return '详细说明不能超过500个字符';
    }
    return '';
  },

  buildPayload() {
    const { form, type, images } = this.data;
    return {
      type,
      parkingNo: form.parkingNo.trim(),
      price: Number(form.price),
      phone: form.phone.trim(),
      // 小区必填：city/area/community 由服务端按 communityId 对应小区回写
      communityId: form.communityId,
      positionDesc: form.positionDesc.trim(),
      specs: form.specs.trim(),
      description: form.description.trim(),
      buildings: (form.buildings || []).join(','),
      images: images.map((item) => ({ id: item.id, url: item.url })),
    };
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

  async submitForm() {
    if (this.data.submitting || this.data.uploading) return;
    const error = this.validateForm();
    if (error) {
      wx.showToast({ title: error, icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    try {
      const payload = this.buildPayload();
      let res;
      if (this.editingId) {
        res = await updateMarket(this.editingId, payload);
      } else {
        res = await addMarket(payload);
      }
      if (res && res.success !== false) {
        wx.showToast({ title: this.editingId ? '保存成功' : '发布成功', icon: 'success' });
        setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      }
    } catch (err) {
      wx.showToast({ title: this.editingId ? '保存失败' : '发布失败', icon: 'none' });
    } finally {
      this.setData({ submitting: false });
    }
  },
});
