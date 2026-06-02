// 版本信息
const APP_VERSION = 'v1.6.0';
const VERSION_NOTES = {
    'v1.0.0': '初始版本 - 基础刷题功能',
    'v1.1.0': '即时反馈 - 选择答案后立即显示对错',
    'v1.2.0': '错题持久化 - 错题自动保存到本地存储',
    'v1.3.0': '随机刷题 - 标签页切换、随机刷题、模拟考试',
    'v1.4.0': '学习统计 - 答题概况、章节分析、学习趋势、数据导出',
    'v1.5.0': '登录系统 - 用户注册登录、云端数据同步',
    'v1.6.0': '功能增强 - 进度条、难度标记、题目收藏、题目搜索'
};

// Supabase配置
const SUPABASE_URL = 'https://lulhihbwzutrhulisryb.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_vJ-YbjSozEnzwZKuS1TCqg_5zuqqfG2';

// 认证管理器
class AuthManager {
    constructor() {
        this.supabase = null;
        this.user = null;
        this.init();
    }

    init() {
        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            this.checkSession();
        } catch (e) {
            console.error('Supabase初始化失败:', e);
        }
    }

    // 检查登录状态
    async checkSession() {
        if (!this.supabase) return;

        const { data: { session } } = await this.supabase.auth.getSession();
        if (session) {
            this.user = session.user;
            this.showUserInfo();
        }
    }

    // 注册
    async register(email, password) {
        if (!this.supabase) return { error: 'Supabase未初始化' };

        const { data, error } = await this.supabase.auth.signUp({
            email: email,
            password: password
        });

        if (error) return { error: error.message };

        this.user = data.user;
        this.showUserInfo();
        return { success: true };
    }

    // 登录
    async login(email, password) {
        if (!this.supabase) return { error: 'Supabase未初始化' };

        const { data, error } = await this.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) return { error: error.message };

        this.user = data.user;
        this.showUserInfo();
        return { success: true };
    }

    // 退出
    async logout() {
        if (!this.supabase) return;

        await this.supabase.auth.signOut();
        this.user = null;
        this.hideUserInfo();
    }

    // 显示用户信息
    showUserInfo() {
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        if (userInfo && userEmail && this.user) {
            userEmail.textContent = this.user.email;
            userInfo.style.display = 'flex';
        }
    }

    // 隐藏用户信息
    hideUserInfo() {
        const userInfo = document.getElementById('user-info');
        if (userInfo) {
            userInfo.style.display = 'none';
        }
    }

    // 获取当前用户
    getUser() {
        return this.user;
    }

    // 是否已登录
    isLoggedIn() {
        return this.user !== null;
    }
}

// 云端同步管理器
class CloudSync {
    constructor(authManager) {
        this.authManager = authManager;
        this.supabase = authManager.supabase;
    }

    // 同步统计数据到云端
    async syncStats(stats) {
        if (!this.authManager.isLoggedIn()) return;

        const user = this.authManager.getUser();
        const { error } = await this.supabase
            .from('user_stats')
            .upsert({
                user_id: user.id,
                total_answered: stats.totalAnswered,
                total_correct: stats.totalCorrect,
                total_study_time: stats.totalStudyTime,
                today_study_time: stats.todayStudyTime,
                last_study_date: stats.lastStudyDate,
                chapter_stats: stats.chapterStats,
                daily_stats: stats.dailyStats,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('同步统计数据失败:', error);
        }
    }

    // 从云端获取统计数据
    async fetchStats() {
        if (!this.authManager.isLoggedIn()) return null;

        const user = this.authManager.getUser();
        const { data, error } = await this.supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (error || !data) return null;

        return {
            totalAnswered: data.total_answered || 0,
            totalCorrect: data.total_correct || 0,
            totalStudyTime: data.total_study_time || 0,
            todayStudyTime: data.today_study_time || 0,
            lastStudyDate: data.last_study_date || new Date().toISOString().split('T')[0],
            chapterStats: data.chapter_stats || {},
            dailyStats: data.daily_stats || {}
        };
    }

    // 同步错题到云端
    async syncWrongQuestions(wrongQuestions) {
        if (!this.authManager.isLoggedIn()) return;

        const user = this.authManager.getUser();

        // 先删除用户的旧错题
        await this.supabase
            .from('user_wrong_questions')
            .delete()
            .eq('user_id', user.id);

        // 插入新错题
        if (wrongQuestions.length > 0) {
            const records = wrongQuestions.map(q => ({
                user_id: user.id,
                question_text: q.question,
                question_data: q
            }));

            const { error } = await this.supabase
                .from('user_wrong_questions')
                .insert(records);

            if (error) {
                console.error('同步错题失败:', error);
            }
        }
    }

    // 从云端获取错题
    async fetchWrongQuestions() {
        if (!this.authManager.isLoggedIn()) return null;

        const user = this.authManager.getUser();
        const { data, error } = await this.supabase
            .from('user_wrong_questions')
            .select('question_data')
            .eq('user_id', user.id);

        if (error) return null;

        return data.map(item => item.question_data);
    }

    // 合并本地和云端数据
    async mergeData(localStats, localWrongQuestions) {
        const cloudStats = await this.fetchStats();
        const cloudWrongQuestions = await this.fetchWrongQuestions();

        // 合并统计数据（取较新的）
        let mergedStats = { ...localStats };
        if (cloudStats) {
            // 取答题数较多的
            if (cloudStats.totalAnswered > localStats.totalAnswered) {
                mergedStats = cloudStats;
            }
            // 合并每日统计
            mergedStats.dailyStats = { ...cloudStats.dailyStats, ...localStats.dailyStats };
            // 合并章节统计
            Object.keys(localStats.chapterStats).forEach(key => {
                if (cloudStats.chapterStats[key]) {
                    mergedStats.chapterStats[key] = {
                        answered: Math.max(
                            localStats.chapterStats[key].answered,
                            cloudStats.chapterStats[key].answered
                        ),
                        correct: Math.max(
                            localStats.chapterStats[key].correct,
                            cloudStats.chapterStats[key].correct
                        )
                    };
                }
            });
        }

        // 合并错题（去重）
        let mergedWrongQuestions = [...localWrongQuestions];
        if (cloudWrongQuestions) {
            const existingQuestions = new Set(localWrongQuestions.map(q => q.question));
            cloudWrongQuestions.forEach(q => {
                if (!existingQuestions.has(q.question)) {
                    mergedWrongQuestions.push(q);
                }
            });
        }

        return { mergedStats, mergedWrongQuestions };
    }
}

// 统计数据管理器
class StatsManager {
    constructor() {
        this.stats = this.loadStats();
        this.studyTimer = null;
        this.studyStartTime = null;
    }

    // 加载统计数据
    loadStats() {
        const saved = localStorage.getItem('java-quiz-stats');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return this.getDefaultStats();
            }
        }
        return this.getDefaultStats();
    }

    // 获取默认统计数据
    getDefaultStats() {
        return {
            totalAnswered: 0,
            totalCorrect: 0,
            totalStudyTime: 0,
            todayStudyTime: 0,
            lastStudyDate: new Date().toISOString().split('T')[0],
            chapterStats: {
                'chapter1-2': { answered: 0, correct: 0 },
                'chapter3': { answered: 0, correct: 0 },
                'chapter4': { answered: 0, correct: 0 },
                'chapter5': { answered: 0, correct: 0 },
                'chapter6': { answered: 0, correct: 0 },
                'chapter7': { answered: 0, correct: 0 },
                'chapter9': { answered: 0, correct: 0 }
            },
            dailyStats: {}
        };
    }

    // 保存统计数据
    saveStats() {
        localStorage.setItem('java-quiz-stats', JSON.stringify(this.stats));
    }

    // 记录答题结果
    recordAnswer(chapterKey, isCorrect) {
        // 检查是否是新的一天
        const today = new Date().toISOString().split('T')[0];
        if (this.stats.lastStudyDate !== today) {
            this.stats.todayStudyTime = 0;
            this.stats.lastStudyDate = today;
        }

        // 更新总统计
        this.stats.totalAnswered++;
        if (isCorrect) {
            this.stats.totalCorrect++;
        }

        // 更新章节统计
        if (this.stats.chapterStats[chapterKey]) {
            this.stats.chapterStats[chapterKey].answered++;
            if (isCorrect) {
                this.stats.chapterStats[chapterKey].correct++;
            }
        }

        // 更新每日统计
        if (!this.stats.dailyStats[today]) {
            this.stats.dailyStats[today] = { total: 0, correct: 0 };
        }
        this.stats.dailyStats[today].total++;
        if (isCorrect) {
            this.stats.dailyStats[today].correct++;
        }

        // 只保留最近30天的数据
        const dates = Object.keys(this.stats.dailyStats).sort();
        while (dates.length > 30) {
            delete this.stats.dailyStats[dates.shift()];
        }

        this.saveStats();
    }

    // 开始学习计时
    startStudyTimer() {
        this.studyStartTime = Date.now();
    }

    // 停止学习计时
    stopStudyTimer() {
        if (this.studyStartTime) {
            const elapsed = Math.floor((Date.now() - this.studyStartTime) / 1000);
            this.stats.totalStudyTime += elapsed;
            this.stats.todayStudyTime += elapsed;
            this.studyStartTime = null;
            this.saveStats();
        }
    }

    // 获取统计数据
    getStats() {
        return { ...this.stats };
    }

    // 导出数据
    exportData() {
        const data = {
            version: APP_VERSION,
            exportDate: new Date().toISOString(),
            stats: this.stats
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `java-quiz-stats-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // 导入数据
    importData(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            if (data.stats) {
                this.stats = { ...this.getDefaultStats(), ...data.stats };
                this.saveStats();
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

    // 清除数据
    clearStats() {
        this.stats = this.getDefaultStats();
        this.saveStats();
    }
}

// 收藏管理器
class FavoriteManager {
    constructor() {
        this.favorites = this.loadFavorites();
    }

    // 加载收藏
    loadFavorites() {
        const saved = localStorage.getItem('java-quiz-favorites');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    // 保存收藏
    saveFavorites() {
        localStorage.setItem('java-quiz-favorites', JSON.stringify(this.favorites));
    }

    // 添加收藏
    addFavorite(question) {
        const exists = this.favorites.some(q => q.question === question.question);
        if (!exists) {
            this.favorites.push(question);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    // 移除收藏
    removeFavorite(questionText) {
        const index = this.favorites.findIndex(q => q.question === questionText);
        if (index !== -1) {
            this.favorites.splice(index, 1);
            this.saveFavorites();
            return true;
        }
        return false;
    }

    // 是否已收藏
    isFavorite(questionText) {
        return this.favorites.some(q => q.question === questionText);
    }

    // 获取所有收藏
    getFavorites() {
        return [...this.favorites];
    }

    // 获取收藏数量
    getCount() {
        return this.favorites.length;
    }
}

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

        // 考试模式相关
        this.isExamMode = false;
        this.examTimeRemaining = 0;
        this.examTimer = null;
        this.examStartTime = null;

        // 计时器拖动相关
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };

        // 统计管理器
        this.statsManager = new StatsManager();

        // 收藏管理器
        this.favoriteManager = new FavoriteManager();

        // 认证管理器
        this.authManager = new AuthManager();

        // 云端同步管理器
        this.cloudSync = new CloudSync(this.authManager);

        // 图表实例
        this.chapterChart = null;
        this.trendChart = null;

        this.init();
    }

    init() {
        this.loadWrongQuestions();
        this.bindEvents();
        this.showVersion();

        // 检查登录状态
        setTimeout(() => {
            if (this.authManager.isLoggedIn()) {
                this.showHome();
                this.syncOnLogin();
            } else {
                this.showLoginPage();
            }
        }, 100);
    }

    // 显示登录页面
    showLoginPage() {
        document.getElementById('login-page').style.display = 'block';
        document.getElementById('home-page').style.display = 'none';
    }

    // 登录后同步数据
    async syncOnLogin() {
        const result = await this.cloudSync.mergeData(
            this.statsManager.getStats(),
            this.wrongQuestions
        );

        // 更新本地数据
        this.statsManager.stats = result.mergedStats;
        this.statsManager.saveStats();

        this.wrongQuestions = result.mergedWrongQuestions;
        this.saveWrongQuestions();

        // 同步到云端
        await this.cloudSync.syncStats(this.statsManager.getStats());
        await this.cloudSync.syncWrongQuestions(this.wrongQuestions);
    }

    // 从localStorage加载错题
    loadWrongQuestions() {
        const saved = localStorage.getItem('java-quiz-wrong-questions');
        if (saved) {
            try {
                this.wrongQuestions = JSON.parse(saved);
            } catch (e) {
                this.wrongQuestions = [];
            }
        }
    }

    // 保存错题到localStorage
    saveWrongQuestions() {
        localStorage.setItem('java-quiz-wrong-questions', JSON.stringify(this.wrongQuestions));
    }

    // 清除错题记录
    clearWrongQuestions() {
        this.wrongQuestions = [];
        this.saveWrongQuestions();
        alert('错题记录已清除！');
        this.updateWrongCount();
    }

    // 显示版本信息
    showVersion() {
        const versionEl = document.getElementById('version-info');
        if (versionEl) {
            versionEl.textContent = `当前版本：${APP_VERSION}`;
            versionEl.title = Object.entries(VERSION_NOTES).map(([ver, note]) => `${ver}: ${note}`).join('\n');
        }
    }

    bindEvents() {
        // 登录相关
        document.querySelectorAll('.login-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.login-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('login-form').style.display =
                    e.target.dataset.tab === 'login' ? 'block' : 'none';
                document.getElementById('register-form').style.display =
                    e.target.dataset.tab === 'register' ? 'block' : 'none';
            });
        });

        document.getElementById('login-btn').addEventListener('click', async () => {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            if (!email || !password) {
                this.showAuthMessage('请填写邮箱和密码', 'error');
                return;
            }
            const result = await this.authManager.login(email, password);
            if (result.error) {
                this.showAuthMessage(result.error, 'error');
            } else {
                this.showAuthMessage('登录成功！', 'success');
                setTimeout(() => {
                    document.getElementById('login-page').style.display = 'none';
                    this.showHome();
                    this.syncOnLogin();
                }, 500);
            }
        });

        document.getElementById('register-btn').addEventListener('click', async () => {
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            if (!email || !password) {
                this.showAuthMessage('请填写邮箱和密码', 'error');
                return;
            }
            if (password.length < 6) {
                this.showAuthMessage('密码至少需要6位', 'error');
                return;
            }
            const result = await this.authManager.register(email, password);
            if (result.error) {
                this.showAuthMessage(result.error, 'error');
            } else {
                this.showAuthMessage('注册成功！请查收验证邮件', 'success');
            }
        });

        document.getElementById('skip-login-btn').addEventListener('click', () => {
            document.getElementById('login-page').style.display = 'none';
            this.showHome();
        });

        document.getElementById('logout-btn').addEventListener('click', async () => {
            await this.authManager.logout();
            this.showLoginPage();
        });

        // 标签页切换
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 章节练习相关
        document.getElementById('chapter-select').addEventListener('change', (e) => {
            if (e.target.value) {
                this.loadChapter(e.target.value);
            }
        });
        document.getElementById('start-btn').addEventListener('click', () => this.startQuiz());
        document.getElementById('wrong-btn').addEventListener('click', () => this.reviewWrong());
        document.getElementById('favorite-btn').addEventListener('click', () => this.reviewFavorites());
        document.getElementById('clear-wrong-btn').addEventListener('click', () => {
            if (confirm('确定要清除所有错题记录吗？')) {
                this.clearWrongQuestions();
            }
        });

        // 搜索相关
        document.getElementById('search-btn').addEventListener('click', () => this.searchQuestions());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchQuestions();
        });

        // 收藏按钮（答题页）
        document.getElementById('favorite-question-btn').addEventListener('click', () => {
            this.toggleFavoriteCurrentQuestion();
        });

        // 随机刷题相关
        document.querySelectorAll('input[name="random-mode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                document.getElementById('chapter-checkboxes').style.display =
                    e.target.value === 'selected' ? 'block' : 'none';
            });
        });

        document.querySelectorAll('#chapter-checkboxes input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => this.updateSelectedCount());
        });

        document.querySelectorAll('.count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('random-custom-count').value = '';
            });
        });

        document.getElementById('random-custom-count').addEventListener('input', (e) => {
            if (e.target.value) {
                document.querySelectorAll('.count-btn').forEach(b => b.classList.remove('active'));
            }
        });

        document.getElementById('start-random-btn').addEventListener('click', () => this.startRandomQuiz());

        // 模拟考试相关
        document.querySelectorAll('.exam-count-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.exam-count-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('exam-custom-count').value = '';
            });
        });

        document.getElementById('exam-custom-count').addEventListener('input', (e) => {
            if (e.target.value) {
                document.querySelectorAll('.exam-count-btn').forEach(b => b.classList.remove('active'));
            }
        });

        document.querySelectorAll('.exam-time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.exam-time-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                document.getElementById('exam-custom-time').value = '';
            });
        });

        document.getElementById('exam-custom-time').addEventListener('input', (e) => {
            if (e.target.value) {
                document.querySelectorAll('.exam-time-btn').forEach(b => b.classList.remove('active'));
            }
        });

        document.getElementById('start-exam-btn').addEventListener('click', () => this.startExam());

        // 答题页导航
        document.getElementById('prev-btn').addEventListener('click', () => this.prevQuestion());
        document.getElementById('next-btn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('submit-btn').addEventListener('click', () => this.submitQuiz());
        document.getElementById('home-btn').addEventListener('click', () => {
            if (this.isExamMode) {
                if (confirm('确定要退出考试吗？考试进度将丢失。')) {
                    this.stopExamTimer();
                    this.showHome();
                }
            } else {
                this.saveWrongQuestions();
                this.showHome();
            }
        });

        // 考试页导航
        document.getElementById('exam-prev-btn').addEventListener('click', () => this.prevExamQuestion());
        document.getElementById('exam-next-btn').addEventListener('click', () => this.nextExamQuestion());
        document.getElementById('exam-submit-btn').addEventListener('click', () => this.submitExam());

        // 结果页
        document.getElementById('retry-btn').addEventListener('click', () => this.retryQuiz());
        document.getElementById('home-btn2').addEventListener('click', () => this.showHome());

        // 计时器拖动
        this.initTimerDrag();

        // 计时器最小化
        document.getElementById('timer-minimize').addEventListener('click', () => {
            document.getElementById('timer-float').classList.toggle('minimized');
        });

        // 弹窗提交按钮
        document.getElementById('modal-submit-btn').addEventListener('click', () => {
            this.submitExam();
        });

        // 统计面板相关
        document.getElementById('export-stats-btn').addEventListener('click', () => {
            this.statsManager.exportData();
            alert('数据导出成功！');
        });

        document.getElementById('import-stats-btn').addEventListener('click', () => {
            document.getElementById('import-file').click();
        });

        document.getElementById('import-file').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    if (this.statsManager.importData(event.target.result)) {
                        alert('数据导入成功！');
                        this.renderStats();
                    } else {
                        alert('数据导入失败，请检查文件格式！');
                    }
                };
                reader.readAsText(file);
            }
        });

        document.getElementById('clear-stats-btn').addEventListener('click', () => {
            if (confirm('确定要清除所有统计数据吗？此操作不可恢复！')) {
                this.statsManager.clearStats();
                this.renderStats();
                alert('数据已清除！');
            }
        });
    }

    // 初始化计时器拖动
    initTimerDrag() {
        const timer = document.getElementById('timer-float');
        const dragHandle = document.getElementById('timer-drag');

        dragHandle.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            const rect = timer.getBoundingClientRect();
            this.dragOffset.x = e.clientX - rect.left;
            this.dragOffset.y = e.clientY - rect.top;
            timer.style.transition = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const x = e.clientX - this.dragOffset.x;
            const y = e.clientY - this.dragOffset.y;
            timer.style.left = x + 'px';
            timer.style.top = y + 'px';
            timer.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            timer.style.transition = 'transform 0.2s';
        });

        // 触摸支持
        dragHandle.addEventListener('touchstart', (e) => {
            this.isDragging = true;
            const rect = timer.getBoundingClientRect();
            const touch = e.touches[0];
            this.dragOffset.x = touch.clientX - rect.left;
            this.dragOffset.y = touch.clientY - rect.top;
            timer.style.transition = 'none';
        });

        document.addEventListener('touchmove', (e) => {
            if (!this.isDragging) return;
            const touch = e.touches[0];
            const x = touch.clientX - this.dragOffset.x;
            const y = touch.clientY - this.dragOffset.y;
            timer.style.left = x + 'px';
            timer.style.top = y + 'px';
            timer.style.right = 'auto';
        });

        document.addEventListener('touchend', () => {
            this.isDragging = false;
            timer.style.transition = 'transform 0.2s';
        });
    }

    // 切换标签页
    switchTab(tabName) {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        document.querySelector(`.tab[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // 切换到统计标签页时渲染统计面板
        if (tabName === 'stats') {
            this.renderStats();
        }
    }

    // 渲染统计面板
    renderStats() {
        const stats = this.statsManager.getStats();

        // 更新答题概况
        document.getElementById('stat-total').textContent = stats.totalAnswered;
        document.getElementById('stat-correct').textContent = stats.totalCorrect;
        document.getElementById('stat-wrong').textContent = stats.totalAnswered - stats.totalCorrect;
        document.getElementById('stat-rate').textContent =
            stats.totalAnswered > 0 ? Math.round((stats.totalCorrect / stats.totalAnswered) * 100) + '%' : '0%';

        // 更新学习时长
        document.getElementById('stat-total-time').textContent = this.formatTime(stats.totalStudyTime);
        document.getElementById('stat-today-time').textContent = this.formatTime(stats.todayStudyTime);

        // 渲染章节分析图表
        this.renderChapterChart(stats);

        // 渲染学习趋势图表
        this.renderTrendChart(stats);

        // 显示薄弱知识点
        this.showWeakChapters(stats);
    }

    // 格式化时间
    formatTime(seconds) {
        if (seconds < 60) return seconds + '秒';
        if (seconds < 3600) return Math.floor(seconds / 60) + '分钟';
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return hours + '小时' + (mins > 0 ? mins + '分钟' : '');
    }

    // 渲染章节分析图表
    renderChapterChart(stats) {
        const ctx = document.getElementById('chapter-chart');
        if (!ctx) return;

        const chapterNames = {
            'chapter1-2': '第1-2章',
            'chapter3': '第3章',
            'chapter4': '第4章',
            'chapter5': '第5章',
            'chapter6': '第6章',
            'chapter7': '第7章',
            'chapter9': '第9章'
        };

        const labels = [];
        const data = [];
        const colors = [];

        Object.entries(stats.chapterStats).forEach(([key, val]) => {
            labels.push(chapterNames[key] || key);
            const rate = val.answered > 0 ? Math.round((val.correct / val.answered) * 100) : 0;
            data.push(rate);
            colors.push(rate < 60 ? '#f5576c' : rate < 80 ? '#f093fb' : '#11998e');
        });

        if (this.chapterChart) {
            this.chapterChart.destroy();
        }

        this.chapterChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '正确率 (%)',
                    data: data,
                    backgroundColor: colors,
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
    }

    // 渲染学习趋势图表
    renderTrendChart(stats) {
        const ctx = document.getElementById('trend-chart');
        if (!ctx) return;

        // 获取最近7天的日期
        const dates = [];
        const totalData = [];
        const correctData = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const monthDay = (date.getMonth() + 1) + '/' + date.getDate();
            dates.push(monthDay);

            const dayStats = stats.dailyStats[dateStr] || { total: 0, correct: 0 };
            totalData.push(dayStats.total);
            correctData.push(dayStats.correct);
        }

        if (this.trendChart) {
            this.trendChart.destroy();
        }

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    {
                        label: '答题数',
                        data: totalData,
                        borderColor: '#667eea',
                        backgroundColor: '#667eea30',
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '正确数',
                        data: correctData,
                        borderColor: '#11998e',
                        backgroundColor: '#11998e30',
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // 显示薄弱知识点
    showWeakChapters(stats) {
        const weakChapters = document.getElementById('weak-chapters');
        if (!weakChapters) return;

        const chapterNames = {
            'chapter1-2': '第1-2章 语法基础',
            'chapter3': '第3章 流程控制',
            'chapter4': '第4章 数组和字符串',
            'chapter5': '第5章 面向对象基础',
            'chapter6': '第6章 面向对象高级',
            'chapter7': '第7章 异常',
            'chapter9': '第9章 IO流'
        };

        const weakItems = [];
        Object.entries(stats.chapterStats).forEach(([key, val]) => {
            if (val.answered > 0) {
                const rate = Math.round((val.correct / val.answered) * 100);
                if (rate < 60) {
                    weakItems.push({
                        name: chapterNames[key] || key,
                        rate: rate
                    });
                }
            }
        });

        if (weakItems.length > 0) {
            weakChapters.style.display = 'block';
            let html = '<h4>⚠ 薄弱知识点（正确率低于60%）</h4>';
            weakItems.forEach(item => {
                html += `<div class="weak-item">${item.name}: <span>${item.rate}%</span></div>`;
            });
            weakChapters.innerHTML = html;
        } else {
            weakChapters.style.display = 'none';
        }
    }

    // 更新选中章节数量
    updateSelectedCount() {
        const checkboxes = document.querySelectorAll('#chapter-checkboxes input[type="checkbox"]:checked');
        let count = 0;
        checkboxes.forEach(cb => {
            const chapter = questions[cb.value];
            if (chapter) {
                count += chapter.questions.length;
            }
        });
        document.getElementById('selected-count').textContent = `已选：${count}题`;
    }

    // 搜索题目
    searchQuestions() {
        const keyword = document.getElementById('search-input').value.trim().toLowerCase();
        if (!keyword) {
            document.getElementById('search-results').style.display = 'none';
            return;
        }

        const results = [];
        Object.entries(questions).forEach(([chapterKey, chapter]) => {
            chapter.questions.forEach(q => {
                if (q.question.toLowerCase().includes(keyword) ||
                    q.explanation.toLowerCase().includes(keyword)) {
                    results.push({ ...q, chapterKey, chapterName: chapter.name });
                }
            });
        });

        this.displaySearchResults(results);
    }

    // 显示搜索结果
    displaySearchResults(results) {
        const container = document.getElementById('search-results');
        const list = document.getElementById('search-results-list');

        if (results.length === 0) {
            list.innerHTML = '<p style="text-align: center; color: #888;">没有找到相关题目</p>';
            container.style.display = 'block';
            return;
        }

        let html = `<p style="color: #888; margin-bottom: 10px;">找到 ${results.length} 道相关题目</p>`;
        results.forEach((q, index) => {
            const difficultyClass = q.difficulty ? `difficulty-${q.difficulty}` : '';
            const difficultyText = q.difficulty === 'easy' ? '简单' :
                                   q.difficulty === 'medium' ? '中等' :
                                   q.difficulty === 'hard' ? '困难' : '';

            html += `
                <div class="search-result-item" onclick="app.startSearchQuiz(${index})">
                    <div class="question-text">${q.question}</div>
                    <span class="chapter-tag">${q.chapterName}</span>
                    ${difficultyText ? `<span class="difficulty-tag ${difficultyClass}">${difficultyText}</span>` : ''}
                </div>
            `;
        });

        list.innerHTML = html;
        container.style.display = 'block';

        // 保存搜索结果用于后续使用
        this.searchResults = results;
    }

    // 开始搜索结果的练习
    startSearchQuiz(index) {
        if (!this.searchResults || !this.searchResults[index]) return;

        this.questions = [this.searchResults[index]];
        this.totalQuestions = 1;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = false;
        this.isExamMode = false;
        this.answeredQuestions = new Set();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    // 收藏题目重做
    reviewFavorites() {
        const favorites = this.favoriteManager.getFavorites();
        if (favorites.length === 0) {
            alert('没有收藏的题目！');
            return;
        }

        this.questions = [...favorites];
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = true;
        this.isExamMode = false;
        this.answeredQuestions = new Set();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    // 切换当前题目的收藏状态
    toggleFavoriteCurrentQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        if (!question) return;

        const btn = document.getElementById('favorite-question-btn');
        if (this.favoriteManager.isFavorite(question.question)) {
            this.favoriteManager.removeFavorite(question.question);
            btn.textContent = '❤ 收藏';
            btn.classList.remove('active');
        } else {
            this.favoriteManager.addFavorite(question);
            btn.textContent = '❤ 已收藏';
            btn.classList.add('active');
        }

        this.updateFavoriteCount();
    }

    // 更新收藏数量显示
    updateFavoriteCount() {
        const count = this.favoriteManager.getCount();
        const el = document.getElementById('favorite-count');
        if (el) {
            el.textContent = count > 0 ? `(${count})` : '';
        }
    }

    // 更新进度条
    updateProgressBar() {
        const progressBar = document.getElementById('progress-bar');
        if (progressBar && this.totalQuestions > 0) {
            const progress = ((this.currentQuestionIndex + 1) / this.totalQuestions) * 100;
            progressBar.style.width = progress + '%';
        }
    }

    // 更新收藏按钮状态
    updateFavoriteButton() {
        const question = this.questions[this.currentQuestionIndex];
        const btn = document.getElementById('favorite-question-btn');
        if (question && btn) {
            if (this.favoriteManager.isFavorite(question.question)) {
                btn.textContent = '❤ 已收藏';
                btn.classList.add('active');
            } else {
                btn.textContent = '❤ 收藏';
                btn.classList.remove('active');
            }
        }
    }

    // 获取难度文本
    getDifficultyText(difficulty) {
        switch (difficulty) {
            case 'easy': return '简单';
            case 'medium': return '中等';
            case 'hard': return '困难';
            default: return '';
        }
    }

    // 获取难度样式类
    getDifficultyClass(difficulty) {
        switch (difficulty) {
            case 'easy': return 'difficulty-easy';
            case 'medium': return 'difficulty-medium';
            case 'hard': return 'difficulty-hard';
            default: return '';
        }
    }

    // 显示认证消息
    showAuthMessage(message, type) {
        const el = document.getElementById('auth-message');
        el.textContent = message;
        el.className = 'auth-message ' + type;
    }

    showHome() {
        // 停止学习计时
        this.statsManager.stopStudyTimer();

        document.getElementById('home-page').style.display = 'block';
        document.getElementById('quiz-page').style.display = 'none';
        document.getElementById('exam-page').style.display = 'none';
        document.getElementById('result-page').style.display = 'none';
        document.getElementById('chapter-select').value = '';
        document.getElementById('chapter-info').style.display = 'none';
        document.getElementById('time-up-modal').style.display = 'none';
        document.getElementById('search-results').style.display = 'none';
        document.getElementById('search-input').value = '';
        this.answeredQuestions = new Set();
        this.isExamMode = false;
        this.updateWrongCount();
        this.updateFavoriteCount();
    }

    // 更新错题数量显示
    updateWrongCount() {
        const wrongCount = document.getElementById('wrong-count');
        const clearBtn = document.getElementById('clear-wrong-btn');
        if (wrongCount) {
            if (this.wrongQuestions.length > 0) {
                wrongCount.textContent = `(${this.wrongQuestions.length}题)`;
                wrongCount.style.display = 'inline';
                if (clearBtn) clearBtn.style.display = 'inline-block';
            } else {
                wrongCount.style.display = 'none';
                if (clearBtn) clearBtn.style.display = 'none';
            }
        }
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

    // 开始章节练习
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
        this.isExamMode = false;
        this.answeredQuestions = new Set();

        // 开始学习计时
        this.statsManager.startStudyTimer();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    // 错题重做
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
        this.isExamMode = false;
        this.answeredQuestions = new Set();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    // 开始随机刷题
    startRandomQuiz() {
        const mode = document.querySelector('input[name="random-mode"]:checked').value;
        let availableQuestions = [];

        if (mode === 'all') {
            // 全部章节
            Object.values(questions).forEach(chapter => {
                availableQuestions.push(...chapter.questions);
            });
        } else {
            // 选中的章节
            document.querySelectorAll('#chapter-checkboxes input[type="checkbox"]:checked').forEach(cb => {
                const chapter = questions[cb.value];
                if (chapter) {
                    availableQuestions.push(...chapter.questions);
                }
            });
        }

        if (availableQuestions.length === 0) {
            alert('没有可选的题目！');
            return;
        }

        // 获取抽题数量
        let count = 10;
        const customCount = document.getElementById('random-custom-count').value;
        if (customCount) {
            count = parseInt(customCount);
        } else {
            const activeBtn = document.querySelector('.count-btn.active');
            if (activeBtn) {
                count = parseInt(activeBtn.dataset.count);
            }
        }

        count = Math.min(count, availableQuestions.length);

        // 随机抽取题目
        this.questions = this.shuffleArray(availableQuestions).slice(0, count);
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = false;
        this.isExamMode = false;
        this.answeredQuestions = new Set();

        // 开始学习计时
        this.statsManager.startStudyTimer();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';

        this.renderQuestion();
    }

    // 开始模拟考试
    startExam() {
        let availableQuestions = [];
        Object.values(questions).forEach(chapter => {
            availableQuestions.push(...chapter.questions);
        });

        if (availableQuestions.length === 0) {
            alert('没有可选的题目！');
            return;
        }

        // 获取考试题数
        let questionCount = 50;
        const customCount = document.getElementById('exam-custom-count').value;
        if (customCount) {
            questionCount = parseInt(customCount);
        } else {
            const activeBtn = document.querySelector('.exam-count-btn.active');
            if (activeBtn) {
                questionCount = parseInt(activeBtn.dataset.count);
            }
        }

        // 获取考试时间
        let timeLimit = 90;
        const customTime = document.getElementById('exam-custom-time').value;
        if (customTime) {
            timeLimit = parseInt(customTime);
        } else {
            const activeBtn = document.querySelector('.exam-time-btn.active');
            if (activeBtn) {
                timeLimit = parseInt(activeBtn.dataset.time);
            }
        }

        questionCount = Math.min(questionCount, availableQuestions.length);

        // 随机抽取题目
        this.questions = this.shuffleArray(availableQuestions).slice(0, questionCount);
        this.totalQuestions = this.questions.length;
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.isReview = false;
        this.isExamMode = true;
        this.answeredQuestions = new Set();

        // 设置考试时间
        this.examTimeRemaining = timeLimit * 60;
        this.updateTimerDisplay();

        // 开始学习计时
        this.statsManager.startStudyTimer();

        document.getElementById('home-page').style.display = 'none';
        document.getElementById('quiz-page').style.display = 'none';
        document.getElementById('exam-page').style.display = 'block';
        document.getElementById('result-page').style.display = 'none';
        document.getElementById('time-up-modal').style.display = 'none';

        // 显示计时器
        const timerFloat = document.getElementById('timer-float');
        timerFloat.style.display = 'flex';
        timerFloat.classList.remove('minimized');
        timerFloat.style.top = '20px';
        timerFloat.style.right = '20px';
        timerFloat.style.left = 'auto';

        // 启动计时器
        this.startExamTimer();

        this.renderExamQuestion();
    }

    // 启动考试计时器
    startExamTimer() {
        this.examTimer = setInterval(() => {
            this.examTimeRemaining--;
            this.updateTimerDisplay();

            if (this.examTimeRemaining <= 0) {
                this.stopExamTimer();
                this.showTimeUpModal();
            } else if (this.examTimeRemaining <= 60) {
                // 最后1分钟，显示警告样式
                document.getElementById('timer-display').classList.add('warning');
            }
        }, 1000);
    }

    // 停止考试计时器
    stopExamTimer() {
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }
    }

    // 更新计时器显示
    updateTimerDisplay() {
        const minutes = Math.floor(this.examTimeRemaining / 60);
        const seconds = this.examTimeRemaining % 60;
        document.getElementById('timer-display').textContent =
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    // 显示时间到弹窗
    showTimeUpModal() {
        document.getElementById('time-up-modal').style.display = 'flex';
        let countdown = 30;
        document.getElementById('countdown').textContent = countdown;

        const countdownTimer = setInterval(() => {
            countdown--;
            document.getElementById('countdown').textContent = countdown;

            if (countdown <= 0) {
                clearInterval(countdownTimer);
                this.submitExam();
            }
        }, 1000);
    }

    // 数组随机排序
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('question-container');
        const progress = document.getElementById('progress');

        progress.textContent = `第 ${this.currentQuestionIndex + 1} / ${this.totalQuestions} 题`;

        // 难度标记
        let difficultyHtml = '';
        if (question.difficulty) {
            const difficultyText = this.getDifficultyText(question.difficulty);
            const difficultyClass = this.getDifficultyClass(question.difficulty);
            difficultyHtml = `<span class="difficulty-badge ${difficultyClass}">${difficultyText}</span>`;
        }

        let html = `${difficultyHtml}<div class="question-text">${this.currentQuestionIndex + 1}. ${question.question}</div>`;

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

        html += '<div id="feedback" class="feedback"></div>';

        container.innerHTML = html;
        this.updateButtons();
        this.bindAnswerEvents(question);

        // 更新进度条和收藏按钮
        this.updateProgressBar();
        this.updateFavoriteButton();

        if (this.answeredQuestions.has(this.currentQuestionIndex)) {
            this.showFeedback(question, this.answers[this.currentQuestionIndex]);
        }
    }

    // 渲染考试题目（无即时反馈）
    renderExamQuestion() {
        const question = this.questions[this.currentQuestionIndex];
        const container = document.getElementById('exam-question-container');
        const progress = document.getElementById('exam-progress');

        progress.textContent = `第 ${this.currentQuestionIndex + 1} / ${this.totalQuestions} 题`;

        let html = `<div class="question-text">${this.currentQuestionIndex + 1}. ${question.question}</div>`;

        switch (question.type) {
            case 'single':
                html += this.renderExamSingleChoice(question);
                break;
            case 'multi':
                html += this.renderExamMultiChoice(question);
                break;
            case 'judge':
                html += this.renderExamJudge(question);
                break;
            case 'fill':
                html += this.renderExamFill(question);
                break;
        }

        container.innerHTML = html;
        this.updateExamButtons();
        this.bindExamAnswerEvents(question);
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

    renderExamSingleChoice(question) {
        const selected = this.answers[this.currentQuestionIndex];
        let html = '<div class="options">';
        question.options.forEach((option, index) => {
            const checked = selected === index ? 'checked' : '';
            html += `
                <label class="option ${checked ? 'selected' : ''}">
                    <input type="radio" name="exam-answer" value="${index}" ${checked}>
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

    renderExamMultiChoice(question) {
        const selected = this.answers[this.currentQuestionIndex] || [];
        let html = '<div class="options multi">';
        question.options.forEach((option, index) => {
            const checked = selected.includes(index) ? 'checked' : '';
            html += `
                <label class="option ${checked ? 'selected' : ''}">
                    <input type="checkbox" name="exam-answer" value="${index}" ${checked}>
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

    renderExamJudge(question) {
        const selected = this.answers[this.currentQuestionIndex];
        let html = '<div class="options">';
        const options = ['正确', '错误'];
        options.forEach((option, index) => {
            const value = index === 0 ? true : false;
            const checked = selected === value ? 'checked' : '';
            html += `
                <label class="option ${checked ? 'selected' : ''}">
                    <input type="radio" name="exam-answer" value="${value}" ${checked}>
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

    renderExamFill(question) {
        const saved = this.answers[this.currentQuestionIndex] || [];
        let html = '<div class="fill-inputs">';
        for (let i = 0; i < question.answer.length; i++) {
            html += `
                <div class="fill-item">
                    <label>空${i + 1}:</label>
                    <input type="text" class="fill-input" data-index="${i}" value="${saved[i] || ''}"
                        placeholder="请输入答案">
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    bindAnswerEvents(question) {
        if (this.answeredQuestions.has(this.currentQuestionIndex)) {
            return;
        }

        if (question.type === 'single' || question.type === 'judge') {
            document.querySelectorAll('input[name="answer"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    if (question.type === 'judge') {
                        this.answers[this.currentQuestionIndex] = e.target.value === 'true';
                    } else {
                        this.answers[this.currentQuestionIndex] = parseInt(e.target.value);
                    }
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

    // 绑定考试答案事件（无即时反馈）
    bindExamAnswerEvents(question) {
        if (question.type === 'single' || question.type === 'judge') {
            document.querySelectorAll('input[name="exam-answer"]').forEach(input => {
                input.addEventListener('change', (e) => {
                    if (question.type === 'judge') {
                        this.answers[this.currentQuestionIndex] = e.target.value === 'true';
                    } else {
                        this.answers[this.currentQuestionIndex] = parseInt(e.target.value);
                    }
                    // 更新选中样式
                    document.querySelectorAll('.option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.option').classList.add('selected');
                });
            });
        } else if (question.type === 'multi') {
            document.querySelectorAll('input[name="exam-answer"]').forEach(input => {
                input.addEventListener('change', () => {
                    const selected = [];
                    document.querySelectorAll('input[name="exam-answer"]:checked').forEach(checked => {
                        selected.push(parseInt(checked.value));
                    });
                    this.answers[this.currentQuestionIndex] = selected;
                    // 更新选中样式
                    document.querySelectorAll('.option').forEach(opt => {
                        opt.classList.toggle('selected', opt.querySelector('input').checked);
                    });
                });
            });
        } else if (question.type === 'fill') {
            document.querySelectorAll('.fill-input').forEach(input => {
                input.addEventListener('input', () => {
                    const values = [];
                    document.querySelectorAll('.fill-input').forEach(inp => {
                        values.push(inp.value.trim());
                    });
                    this.answers[this.currentQuestionIndex] = values;
                });
            });
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

        // 记录统计数据
        const chapterKey = this.findChapterKey(question);
        if (chapterKey) {
            this.statsManager.recordAnswer(chapterKey, isCorrect);
        }

        if (isCorrect) {
            this.score++;
            const wrongIndex = this.wrongQuestions.findIndex(q => q.question === question.question);
            if (wrongIndex !== -1) {
                this.wrongQuestions.splice(wrongIndex, 1);
                this.saveWrongQuestions();
            }
        } else {
            const exists = this.wrongQuestions.some(q => q.question === question.question);
            if (!exists) {
                this.wrongQuestions.push({...question, userAnswer});
                this.saveWrongQuestions();
            }
        }

        // 云端同步
        if (this.authManager.isLoggedIn()) {
            this.cloudSync.syncStats(this.statsManager.getStats());
            this.cloudSync.syncWrongQuestions(this.wrongQuestions);
        }
    }

    // 查找题目所属章节
    findChapterKey(question) {
        // 章节练习模式
        if (this.currentChapter && !this.isExamMode) {
            return this.currentChapter;
        }

        // 随机刷题和考试模式：遍历查找
        for (const [key, chapter] of Object.entries(questions)) {
            if (chapter.questions.some(q => q.question === question.question)) {
                return key;
            }
        }
        return null;
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

    updateExamButtons() {
        const prevBtn = document.getElementById('exam-prev-btn');
        const nextBtn = document.getElementById('exam-next-btn');

        prevBtn.disabled = this.currentQuestionIndex === 0;
        nextBtn.disabled = this.currentQuestionIndex === this.totalQuestions - 1;
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

    prevExamQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderExamQuestion();
        }
    }

    nextExamQuestion() {
        if (this.currentQuestionIndex < this.totalQuestions - 1) {
            this.currentQuestionIndex++;
            this.renderExamQuestion();
        }
    }

    submitQuiz() {
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

    // 提交考试
    submitExam() {
        this.stopExamTimer();
        document.getElementById('time-up-modal').style.display = 'none';
        document.getElementById('timer-float').style.display = 'none';

        // 计算考试成绩
        this.score = 0;
        this.wrongQuestions = [];

        this.questions.forEach((question, index) => {
            const userAnswer = this.answers[index];
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

            // 记录统计数据
            const chapterKey = this.findChapterKey(question);
            if (chapterKey) {
                this.statsManager.recordAnswer(chapterKey, isCorrect);
            }

            if (isCorrect) {
                this.score++;
            } else {
                this.wrongQuestions.push({...question, userAnswer});
            }
        });

        // 云端同步
        if (this.authManager.isLoggedIn()) {
            this.cloudSync.syncStats(this.statsManager.getStats());
            this.cloudSync.syncWrongQuestions(this.wrongQuestions);
        }

        this.showResult();
    }

    showResult() {
        document.getElementById('quiz-page').style.display = 'none';
        document.getElementById('exam-page').style.display = 'none';
        document.getElementById('result-page').style.display = 'block';

        const totalAnswered = this.isExamMode ? this.totalQuestions : this.answeredQuestions.size;
        const percentage = totalAnswered > 0 ? Math.round((this.score / totalAnswered) * 100) : 0;
        document.getElementById('score').textContent = `${this.score} / ${totalAnswered}`;
        document.getElementById('percentage').textContent = `正确率 ${percentage}%`;

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

    retryQuiz() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.score = 0;
        this.answeredQuestions = new Set();

        document.getElementById('result-page').style.display = 'none';

        if (this.isExamMode) {
            document.getElementById('exam-page').style.display = 'block';
            this.examTimeRemaining = 90 * 60; // 重置为90分钟
            this.updateTimerDisplay();
            document.getElementById('timer-float').style.display = 'flex';
            this.startExamTimer();
            this.renderExamQuestion();
        } else {
            document.getElementById('quiz-page').style.display = 'block';
            this.renderQuestion();
        }
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new QuizApp();
});
