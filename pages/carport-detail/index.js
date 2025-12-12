Page({
  data: {
    current: 0,
    // 轮播图数据：包含环境图、车位图、平面图
    swiperList: [
      'https://tdesign.gtimg.com/miniprogram/images/example1.png', // 占位图
      'https://tdesign.gtimg.com/miniprogram/images/example2.png',
      'https://tdesign.gtimg.com/miniprogram/images/example3.png',
    ],
    // 详情数据对象
    detail: {
      id: '1',
      number: 'A088',
      zone: 'B2区',
      floor: '地下二层 (B2)',
      price: '600',
    }
  },

  onLoad(options) {
    // options.id 是从列表页传过来的 ID
    const id = options.id;
    console.log('正在请求车位ID详情:', id);
    // 这里后续可以接接口请求
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: '发现一个不错的车位：B2-A088',
      path: '/pages/detail/detail?id=' + this.data.detail.id
    };
  }
});