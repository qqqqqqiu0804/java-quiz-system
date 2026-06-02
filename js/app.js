// 刷题系统主程序
class QuizApp {
    constructor() {
        this.currentChapter = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.answers = {};
        this.score = 0;
        this.totalQuestions = 0;
        this.isReview = false;
        this.wrongQuestions = [];
        this.answeredQuestions = new Set();
        this.init();
    }

    init() {
        this.bindEvents();
        this.showHome();
    }

    bindEvents() {
        // 章节选择
        document.getElementById('chapter-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadChapter(e.target.value);
            }
        });

        // 开始练习按钮
        document.getElementById('start-btn').addEventListener('click', () => {
            this.startQuiz();
        });

        // 错题重做按钮
        document.getElementById('wrong-btn').addEventListener('click', () => {
            this.reviewWrong();
        });

        // 上一题/下一题
        document.getElementById('prev-btn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());

        // 提交答案
        document.getElementById('submit-btn').addEventListener('click', () => this.submitQuiz());

        // 返回首页
        document.getElementById('home-btn').addEventListener('click', () => this.showHome());
        document.getElementById('home-btn2').addEventListener('click', () => this.showHome());

        // 再来一次
        document.getElementById('retry-btn').addEventListener('click', () => this.retryQuiz());
    }

    showHome() {
        document.getElementById('home-page').style.display = 'block';
        document.getElementById('quiz-page').style.display = 'none';
        document.getElementById('result-page').style.display = 'none';
        document.getElementById('chapter-select').value = '';
        document.getElementById('chapter-info').style.display = 'none';
        this.wrongQuestions = [];
        this.answeredQuestions = new Set();
    }

    loadChapter(chapterKey) {
        const chapter = questions[chapterKey];
        if (chapter) {
            this.currentChapter = chapterKey;
            const info = document.getElementById('chapter-info');
            info.style.display = 'block';
            info.innerHTML = `
                <p><strong>${chapter.name}</strong></p>
                <p>共 ${chapter.questions.length} 题</p>
            `;
        }
    }

    startQuiz() {
        if (!this.currentChapter) {
            alert('请先选择章节！');
            return;
        }

        const chapter = questions[this.currentChapter];
        this.questions = [...chapter.questions];
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = false;
        this.answeredQuestions = new Set();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    reviewWrong() {
        if (this.wrongQuestions.length === 0) {
            alert('没有错题！');
            return;
        }

        this.questions = [...this.wrongQuestions];
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = true;
        this.answeredQuestions = new Set();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    renderQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('question-container');
        const progress = document.getElementById('progress');

        progress.textContent = `第 ${this.currentQuestionIndex + 1} / ${this.totalQuestions} 题`;

        let html = `<div class="question-text">${this.currentQuestionIndex + 1}. ${question.question}</div>`;

        switch (question.type) {
            case 'single':
                html += this.renderSingleChoice(question);
                break;
            case 'multi':
                html += this.renderMultiChoice(question);
                break;
            case 'judge':
                html += this.renderJudge(question);
                break;
            case 'fill':
                html += this.renderFill(question);
                break;
        }

        // 添加反馈区域
        html += '<div id="feedback" class="feedback"></div>';

        container.innerHTML = html;
        this.updateButtons();
        this.bindAnswerEvents(question);

        // 如果已经答过这道题，显示反馈
        if (this.answeredQuestions.has(this.currentQuestionIndex)) {
            this.showFeedback(question, this.answers[this.currentQuestionIndex]);
        }
    }

    renderSingleChoice(question) {
        let html = '<div class="options">';
        question.options.forEach((option, index) => {
            const checked = this.answers[this.currentQuestionIndex] === index ? 'checked' : '';
            let optionClass = 'option';
            if (this.answeredQuestions.has(this.currentQuestionIndex)) {
                if (index === question.answer) {
                    optionClass += ' correct';
                } else if (checked && index !== question.answer) {
                    optionClass += ' wrong';
                }
            }
            html += `
                <label class="${optionClass}">
                    <input type="radio" name="answer" value="${index}" ${checked} ${this.answeredQuestions.has(this.currentQuestionIndex) ? 'disabled' : ''}>
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option}</span>
                </label>
            `;
        });
        html += '</div>';
        return html;
    }

    renderMultiChoice(question) {
        let html = '<div class="options multi">';
        const selected = this.answers[this.currentQuestionIndex] || [];
        question.options.forEach((option, index) => {
            const checked = selected.includes(index) ? 'checked' : '';
            let optionClass = 'option';
            if (this.answeredQuestions.has(this.currentQuestionIndex)) {
                if (question.answer.includes(index)) {
                    optionClass += ' correct';
                } else if (checked && !question.answer.includes(index)) {
                    optionClass += ' wrong';
                }
            }
            html += `
                <label class="${optionClass}">
                    <input type="checkbox" name="answer" value="${index}" ${checked} ${this.answeredQuestions.has(this.currentQuestionIndex) ? 'disabled' : ''}>
                    <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                    <span class="option-text">${option}</span>
                </label>
            `;
        });
        html += '</div>';
        return html;
    }

    renderJudge(question) {
        let html = '<div class="options">';
        const options = ['正确', '错误'];
        options.forEach((option, index) => {
            const value = index === 0 ? true : false;
            const checked = this.answers[this.currentQuestionIndex] === value ? 'checked' : '';
            let optionClass = 'option';
            if (this.answeredQuestions.has(this.currentQuestionIndex)) {
                if (value === question.answer) {
                    optionClass += ' correct';
                } else if (checked && value !== question.answer) {
                    optionClass += ' wrong';
                }
            }
            html += `
                <label class="${optionClass}">
                    <input type="radio" name="answer" value="${value}" ${checked} ${this.answeredQuestions.has(this.currentQuestionIndex) ? 'disabled' : ''}>
                    <span class="option-text">${option}</span>
                </label>
            `;
        });
        html += '</div>';
        return html;
    }

    renderFill(question) {
        const saved = this.answers[this.currentQuestionIndex] || [];
        let html = '<div class="fill-inputs">';
        for (let i = 0; i < question.answer.length; i++) {
            let inputClass = 'fill-input';
            if (this.answeredQuestions.has(this.currentQuestionIndex) && saved[i] !== undefined) {
                const isCorrect = saved[i].toLowerCase().replace(/\s+/g, '') ===
                    question.answer[i].toLowerCase().replace(/\s+/g, '');
                inputClass += isCorrect ? ' correct' : ' wrong';
            }
            html += `
                <div class="fill-item">
                    <label>空${i + 1}:</label>
                    <input type="text" class="${inputClass}" data-index="${i}" value="${saved[i] || ''}"
                        placeholder="请输入答案" ${this.answeredQuestions.has(this.currentQuestionIndex) ? 'disabled' : ''}>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    bindAnswerEvents(question) {
        if (this.answeredQuestions.has(this.currentQuestionIndex)) {
            return; // 已经答过，不再绑定事件
        }

        if (question.type === 'single' || question.type === 'judge') {
            document.querySelectorAll('input[name="answer"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    if (question.type === 'judge') {
                        this.answers[this.currentQuestionIndex] = e.target.value === 'true';
                    } else {
                        this.answers[this.currentQuestionIndex] = parseInt(e.target.value);
                    }

                    // 立即显示反馈
                    this.answeredQuestions.add(this.currentQuestionIndex);
                    this.checkAnswer(question);
                    this.renderQuestion();
                });
            });
        } else if (question.type === 'multi') {
            document.querySelectorAll('input[name="answer"]').forEach(input => {
                input.addEventListener('change', () => {
                    const selected = [];
                    document.querySelectorAll('input[name="answer"]:checked').forEach(checked => {
                        selected.push(parseInt(checked.value));
                    });
                    this.answers[this.currentQuestionIndex] = selected;

                    // 多选题需要点击确认按钮
                    if (!document.getElementById('confirm-multi')) {
                        const confirmBtn = document.createElement('button');
                        confirmBtn.id = 'confirm-multi';
                        confirmBtn.className = 'btn btn-primary';
                        confirmBtn.textContent = '确认答案';
                        confirmBtn.style.marginTop = '10px';
                        confirmBtn.addEventListener('click', () => {
                            this.answeredQuestions.add(this.currentQuestionIndex);
                            this.checkAnswer(question);
                            this.renderQuestion();
                        });
                        document.querySelector('.options.multi').after(confirmBtn);
                    }
                });
            });
        } else if (question.type === 'fill') {
            // 填空题添加确认按钮
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirm-fill';
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.textContent = '确认答案';
            confirmBtn.style.marginTop = '10px';
            confirmBtn.addEventListener('click', () => {
                const values = [];
                document.querySelectorAll('.fill-input').forEach(inp => {
                    values.push(inp.value.trim());
                });
                this.answers[this.currentQuestionIndex] = values;
                this.answeredQuestions.add(this.currentQuestionIndex);
                this.checkAnswer(question);
                this.renderQuestion();
            });
            document.querySelector('.fill-inputs').after(confirmBtn);
        }
    }

    checkAnswer(question) {
        const userAnswer = this.answers[this.currentQuestionIndex];
        let isCorrect = false;

        switch (question.type) {
            case 'single':
                isCorrect = userAnswer === question.answer;
                break;
            case 'multi':
                isCorrect = Array.isArray(userAnswer) &&
                    Array.isArray(question.answer) &&
                    userAnswer.length === question.answer.length &&
                    userAnswer.every(a => question.answer.includes(a));
                break;
            case 'judge':
                isCorrect = userAnswer === question.answer;
                break;
            case 'fill':
                if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
                    isCorrect = userAnswer.length === question.answer.length &&
                        userAnswer.every((a, i) =>
                            a.toLowerCase().replace(/\s+/g, '') ===
                            question.answer[i].toLowerCase().replace(/\s+/g, '')
                        );
                }
                break;
        }

        if (isCorrect) {
            this.score++;
        } else {
            if (!this.wrongQuestions.includes(question)) {
                this.wrongQuestions.push({...question, userAnswer});
            }
        }
    }

    showFeedback(question, userAnswer) {
        const feedback = document.getElementById('feedback');
        if (!feedback) return;

        const isCorrect = this.isAnswerCorrect(question, userAnswer);

        let html = `<div class="feedback-box ${isCorrect ? 'correct' : 'wrong'}">`;
        html += `<div class="feedback-icon">${isCorrect ? '✓ 回答正确！' : '✗ 回答错误'}</div>`;
        html += `<div class="feedback-answer">正确答案：${this.getCorrectAnswerText(question)}</div>`;
        html += `<div class="feedback-explanation">${question.explanation}</div>`;
        html += '</div>';

        feedback.innerHTML = html;
        feedback.style.display = 'block';
    }

    isAnswerCorrect(question, userAnswer) {
        switch (question.type) {
            case 'single':
                return userAnswer === question.answer;
            case 'multi':
                return Array.isArray(userAnswer) &&
                    Array.isArray(question.answer) &&
                    userAnswer.length === question.answer.length &&
                    userAnswer.every(a => question.answer.includes(a));
            case 'judge':
                return userAnswer === question.answer;
            case 'fill':
                if (Array.isArray(userAnswer) && Array.isArray(question.answer)) {
                    return userAnswer.length === question.answer.length &&
                        userAnswer.every((a, i) =>
                            a.toLowerCase().replace(/\s+/g, '') ===
                            question.answer[i].toLowerCase().replace(/\s+/g, '')
                        );
                }
                return false;
            default:
                return false;
        }
    }

    getCorrectAnswerText(question) {
        switch (question.type) {
            case 'single':
                return question.options[question.answer];
            case 'multi':
                return question.answer.map(i => question.options[i]).join(', ');
            case 'judge':
                return question.answer ? '正确' : '错误';
            case 'fill':
                return question.answer.join(', ');
            default:
                return '';
        }
    }

    updateButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitBtn = document.getElementById('submit-btn');

        prevBtn.disabled = this.currentQuestionIndex === 0;

        if (this.currentQuestionIndex === this.totalQuestions - 1) {
            nextBtn.style.display = 'none';
            submitBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
            submitBtn.style.display = 'none';
        }
    }

    prevQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }
    }

    submitQuiz() {
        // 统计未答题数量
        const unanswered = [];
        for (let i = 0; i < this.totalQuestions; i++) {
            if (!this.answeredQuestions.has(i)) {
                unanswered.push(i + 1);
            }
        }

        if (unanswered.length > 0) {
            if (!confirm(`还有 ${unanswered.length} 题未作答，确定提交吗？`)) {
                return;
            }
        }

        this.showResult();
    }

    showResult() {
        document.getElementById('quiz-page').style.display = 'none';
        document.getElementById('result-page').style.display = 'block';

        const totalAnswered = this.answeredQuestions.size;
        const percentage = totalAnswered > 0 ? Math.round((this.score / totalAnswered) * 100) : 0;
        document.getElementById('score').textContent = `${this.score} / ${totalAnswered}`;
        document.getElementById('percentage').textContent = `正确率 ${percentage}%`;

        // 显示错题详情
        const wrongList = document.getElementById('wrong-list');
        if (this.wrongQuestions.length > 0) {
            document.getElementById('wrong-section').style.display = 'block';
            let html = '';
            this.wrongQuestions.forEach((q, index) => {
                html += `
                    <div class="wrong-item">
                        <div class="wrong-question">${index + 1}. ${q.question}</div>
                        <div class="wrong-answer">你的答案：${this.getUserAnswerText(q)}</div>
                        <div class="correct-answer">正确答案：${this.getCorrectAnswerText(q)}</div>
                        <div class="explanation">${q.explanation}</div>
                    </div>
                `;
            });
            wrongList.innerHTML = html;
        } else {
            document.getElementById('wrong-section').style.display = 'none';
        }
    }

    getUserAnswerText(question) {
        const userAnswer = question.userAnswer;
        if (userAnswer === undefined) return '未作答';

        switch (question.type) {
            case 'single':
                return question.options[userAnswer];
            case 'multi':
                return userAnswer.map(i => question.options[i]).join(', ');
            case 'judge':
                return userAnswer ? '正确' : '错误';
            case 'fill':
                return userAnswer.join(', ');
            default:
                return '未作答';
        }
    }

    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.wrongQuestions = [];
        this.answeredQuestions = new Set();

        document.getElementById('result-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';

        this.renderQuestion();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
