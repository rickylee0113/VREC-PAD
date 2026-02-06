import { Team } from './types';

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team-eagle',
    name: '烏野高中',
    createdAt: Date.now(),
    players: [
      { id: 'p1', number: '10', name: '日向翔陽' },
      { id: 'p2', number: '9', name: '影山飛雄' },
      { id: 'p3', number: '11', name: '月島螢' },
      { id: 'p4', number: '4', name: '西谷夕' },
      { id: 'p5', number: '5', name: '田中龍之介' },
      { id: 'p6', number: '3', name: '東峰旭' },
      { id: 'p7', number: '2', name: '菅原孝支' },
      { id: 'p8', number: '1', name: '澤村大地' },
    ],
  },
  {
    id: 'team-cats',
    name: '音駒高中',
    createdAt: Date.now() - 10000,
    players: [
      { id: 'n1', number: '1', name: '黑尾鐵朗' },
      { id: 'n2', number: '5', name: '孤爪研磨' },
      { id: 'n3', number: '3', name: '夜久衛輔' },
      { id: 'n4', number: '4', name: '山本猛虎' },
      { id: 'n5', number: '7', name: '犬岡走' },
      { id: 'n6', number: '11', name: '灰羽列夫' },
      { id: 'n7', number: '2', name: '海信行' },
      { id: 'n8', number: '12', name: '福永招平' },
    ],
  },
];
