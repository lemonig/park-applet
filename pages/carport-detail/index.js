import { detailMarket } from '../../api/market';
import { listDictItems } from '../../api/dict';

const PLACEHOLDER_IMG = 'https://tdesign.gtimg.com/miniprogram/images/example1.png';

Page({
  data: {
    titleProps: {
      title: '车位详情',
    },
    id: null,
    loading: true,
    current: 0,
    swiperList: [],
    detail: {},
    statusText: '',
    statusTheme: 'default',
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '参数缺失', icon: 'none' });
      setTimeout(() => wx.navigateBack({ delta: 1 }), 800);
      return;
    }
    this.setData({ id });
    this.fetchDetail(id);
  },

  async fetchDetail(id) {
    this.setData({ loading: true });
    try {
      const res = await detailMarket(id);
      if (res && res.success !== false && res.data) {
        this.renderDetail(res.data);
      } else {
        wx.showToast({ title: (res && res.message) || '获取详情失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '获取详情失败', icon: 'none' });
    } finally {
      this.setData({ loading: false });
    }
  },

  renderDetail(item) {
    const images = (item.images || []).map((img) => img.url).filter(Boolean);
    const typeText = item.type === 1 ? '出售' : '出租';
    const unit = item.type === 1 ? '元' : '元/月';
    let statusText = '';
    let statusTheme = 'default';
    if (item.status === 0) { statusText = '待审核'; statusTheme = 'warning'; }
    else if (item.status === 1) { statusText = '已通过'; statusTheme = 'success'; }
    else if (item.status === 2) { statusText = '已拒绝'; statusTheme = 'danger'; }

    const buildings = item.buildings ? String(item.buildings).split(',').map((v) => v.trim()).filter(Boolean) : [];

    this.setData({
      detail: {
        ...item,
        typeText,
        unit,
        priceText: item.price != null ? String(item.price) : '-',
        buildings,
      },
      statusText,
      statusTheme,
      swiperList: images.length ? images : [PLACEHOLDER_IMG],
    });
    if (buildings.length) {
      this.resolveBuildingLabels(buildings);
    }
    wx.setNavigationBarTitle({ title: `${typeText}车位详情` });
  },

  // 将楼栋 value 转为字典 label，用于详情页展示
  async resolveBuildingLabels(buildings) {
    try {
      const res = await listDictItems('ld_1');
      const items = res && res.success && Array.isArray(res.data) ? res.data : [];
      if (!items.length) return;
      const map = {};
      items.forEach((it) => { map[it.value] = it.label; });
      const labels = buildings.map((v) => map[v] || v);
      this.setData({ 'detail.buildingsText': labels });
    } catch (err) {
      // 静默失败，保留原始值
    }
  },

  // 联系房东
  onCall() {
    const phone = this.data.detail.phone;
    if (!phone) {
      wx.showToast({ title: '暂无联系电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({ phoneNumber: String(phone) });
  },

  // 立即预订（交易闭环 P1 实现，当前占位）
  onBook() {
    wx.showToast({ title: '在线预订功能开发中', icon: 'none' });
  },

  onPreview(e) {
    const index = e.currentTarget.dataset.index;
    wx.previewImage({
      current: this.data.swiperList[index],
      urls: this.data.swiperList,
    });
  },

  onShareAppMessage() {
    const { detail } = this.data;
    return {
      title: `发现一个不错的车位：${detail.parkingNo || ''}`,
      path: `/pages/carport-detail/index?id=${this.data.id || detail.id || ''}`,
    };
  },
});
