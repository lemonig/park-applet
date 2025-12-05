import dayjs from 'dayjs';
import { formatTime } from '../../utils/util';
import {
  listCarport,

} from '../../api/car';

Page({
  data: {
    titleProps: {
      title: '首页',
    },
    // 模拟车位列表数据
    parkingList: [
      {
        id: '1',
        number: 'B2-A088',
        price: '600',
        status: 'available', // 状态控制
        statusText: '闲置',
        tags: ['监控覆盖', '独立车位'],
        // 使用 TDesign 官网或颜色块作为占位图
        imageUrl: 'https://tdesign.gtimg.com/miniprogram/images/example1.png'
      },
      {
        id: '2',
        number: 'B2-C102',
        price: '450',
        status: 'available',
        statusText: '特价',
        tags: ['靠近电梯', '柱子旁'],
        imageUrl: 'https://tdesign.gtimg.com/miniprogram/images/example2.png'
      },
      {
        id: '3',
        number: 'B1-VIP01',
        price: '1200',
        status: 'sold', // 已租状态
        statusText: '已租',
        tags: ['充电桩', '加宽', 'VIP区'],
        // 灰色占位图示意
        imageUrl: 'https://tdesign.gtimg.com/miniprogram/images/example3.png'
      },
      {
        id: '4',
        number: 'B3-D055',
        price: '300',
        status: 'available',
        statusText: '新上架',
        tags: ['B3层', '价格优惠'],
        imageUrl: 'https://tdesign.gtimg.com/miniprogram/images/example1.png'
      }
    ]
  },
  fetchData: async function () {
    let params = {
      page: this.data.pageNo,
      size: 30,
      data: {
    
      },
    };
    let { data, additional_data } = await listCarport(params);
    if (additional_data.pagination.total === this.data.pageData.length) {
      this.setData({
        isAllData: true,
        loading: false,
      });
      return;
    }
    this.setData({
      loading: false,
      pageData: this.data.pageData.concat(data),
    });
  },
  // 预订按钮点击事件
  onBook(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: `选择了车位 ID: ${id}`,
      icon: 'none'
    });
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.fetchData();
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.setData({
      isAllData: false,
    });
    this.fetchData();

    this.getTabBar().init();
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    // this.setData({
    //   pageData: [],
    //   pageNo: 1,
    // });
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {},

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {},
 
});
