const { knowledgeQuestions } = require('../../utils/quizData.js');

const HIGH_SCORE_KEY = 'qiaolinQuizHighScore';

Page({
  data: {
    questions: knowledgeQuestions,
    currentIndex: 0,
    currentQuestion: knowledgeQuestions[0],
    selectedIndex: -1,
    answered: false,
    correctCount: 0,
    completed: false,
    highScore: 0,
    scorePercent: 0
  },

  onLoad() {
    this.setData({ highScore: Number(wx.getStorageSync(HIGH_SCORE_KEY)) || 0 });
  },

  onSelectOption(e) {
    if (this.data.answered) return;
    const selectedIndex = Number(e.currentTarget.dataset.index);
    const correct = selectedIndex === this.data.currentQuestion.answerIndex;
    this.setData({
      selectedIndex,
      answered: true,
      correctCount: this.data.correctCount + (correct ? 1 : 0)
    });
    wx.vibrateShort({ type: correct ? 'light' : 'medium' });
  },

  onNextQuestion() {
    if (!this.data.answered) {
      wx.showToast({ title: '请先选择答案', icon: 'none' });
      return;
    }
    const nextIndex = this.data.currentIndex + 1;
    if (nextIndex >= this.data.questions.length) {
      const scorePercent = Math.round(
        this.data.correctCount / this.data.questions.length * 100
      );
      const highScore = Math.max(this.data.highScore, scorePercent);
      wx.setStorageSync(HIGH_SCORE_KEY, highScore);
      this.setData({ completed: true, scorePercent, highScore });
      return;
    }
    this.setData({
      currentIndex: nextIndex,
      currentQuestion: this.data.questions[nextIndex],
      selectedIndex: -1,
      answered: false
    });
  },

  onRestart() {
    this.setData({
      currentIndex: 0,
      currentQuestion: this.data.questions[0],
      selectedIndex: -1,
      answered: false,
      correctCount: 0,
      completed: false,
      scorePercent: 0
    });
  },

  onBackToTour() {
    const pages = getCurrentPages();
    if (pages.length > 1) wx.navigateBack();
    else wx.redirectTo({ url: '/pages/study-tour/index' });
  },

  onShareAppMessage() {
    return {
      title: '来挑战乔林村红色知识闯关',
      path: '/pages/knowledge-quiz/index'
    };
  }
});
