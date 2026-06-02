// 版本信息
const APP_VERSION = 'v1.9.0';
const VERSION_NOTES = {
    'v1.0.0': '初始版本 - 基础刷题功能',
    'v1.1.0': '即时反馈 - 选择答案后立即显示对错',
    'v1.2.0': '错题持久化 - 错题自动保存到本地存储',
    'v1.3.0': '随机刷题 - 标签页切换、随机刷题、模拟考试',
    'v1.4.0': '学习统计 - 答题概况、章节分析、学习趋势、数据导出',
    'v1.5.0': '登录系统 - 用户注册登录、云端数据同步',
    'v1.6.0': '功能增强 - 进度条、难度标记、题目收藏、题目搜索',
    'v1.7.0': '历史记录 - 答题历史、错题导出',
    'v1.8.0': '成就系统 - 成就解锁、成就通知',
    'v1.9.0': '题库管理 - 自定义题库、题库导入导出'
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

// 答题历史管理器
class HistoryManager {
    constructor() {
        this.history = this.loadHistory();
    }

    // 加载历史记录
    loadHistory() {
        const saved = localStorage.getItem('java-quiz-history');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    // 保存历史记录
    saveHistory() {
        localStorage.setItem('java-quiz-history', JSON.stringify(this.history));
    }

    // 添加历史记录
    addRecord(record) {
        const newRecord = {
            id: Date.now(),
            date: new Date().toISOString(),
            ...record
        };
        this.history.unshift(newRecord); // 添加到开头

        // 只保留最近50条记录
        if (this.history.length > 50) {
            this.history = this.history.slice(0, 50);
        }

        this.saveHistory();
        return newRecord;
    }

    // 获取所有历史记录
    getHistory() {
        return [...this.history];
    }

    // 获取历史记录数量
    getCount() {
        return this.history.length;
    }

    // 清除历史记录
    clearHistory() {
        this.history = [];
        this.saveHistory();
    }

    // 删除单条记录
    deleteRecord(id) {
        this.history = this.history.filter(r => r.id !== id);
        this.saveHistory();
    }
}

// 成就管理器
class AchievementManager {
    constructor() {
        this.achievements = this.loadAchievements();
        this.definitions = this.getAchievementDefinitions();
    }

    // 获取成就定义
    getAchievementDefinitions() {
        return [
            { id: 'first_quiz', name: '初试牛刀', desc: '完成第一次答题', icon: '🎯', condition: (stats) => stats.totalAnswered >= 1 },
            { id: 'quiz_10', name: '勤学苦练', desc: '累计答题10道', icon: '📝', condition: (stats) => stats.totalAnswered >= 10 },
            { id: 'quiz_50', name: '学海无涯', desc: '累计答题50道', icon: '📚', condition: (stats) => stats.totalAnswered >= 50 },
            { id: 'quiz_100', name: '百题大关', desc: '累计答题100道', icon: '🏆', condition: (stats) => stats.totalAnswered >= 100 },
            { id: 'quiz_200', name: '题海战术', desc: '累计答题200道', icon: '💪', condition: (stats) => stats.totalAnswered >= 200 },
            { id: 'quiz_500', name: '学霸之路', desc: '累计答题500道', icon: '👑', condition: (stats) => stats.totalAnswered >= 500 },
            { id: 'accuracy_60', name: '及格万岁', desc: '正确率达到60%', icon: '✅', condition: (stats) => stats.totalAnswered >= 10 && (stats.totalCorrect / stats.totalAnswered) >= 0.6 },
            { id: 'accuracy_80', name: '成绩优异', desc: '正确率达到80%', icon: '🌟', condition: (stats) => stats.totalAnswered >= 20 && (stats.totalCorrect / stats.totalAnswered) >= 0.8 },
            { id: 'accuracy_90', name: '学霸本霸', desc: '正确率达到90%', icon: '💎', condition: (stats) => stats.totalAnswered >= 50 && (stats.totalCorrect / stats.totalAnswered) >= 0.9 },
            { id: 'perfect_10', name: '十全十美', desc: '连续答对10题', icon: '🔥', condition: (stats) => stats.maxStreak >= 10 },
            { id: 'perfect_20', name: '势不可挡', desc: '连续答对20题', icon: '⚡', condition: (stats) => stats.maxStreak >= 20 },
            { id: 'perfect_50', name: '所向披靡', desc: '连续答对50题', icon: '🚀', condition: (stats) => stats.maxStreak >= 50 },
            { id: 'chapter_all', name: '全面发展', desc: '完成所有章节练习', icon: '📖', condition: (stats) => stats.chaptersCompleted >= 7 },
            { id: 'study_1h', name: '学海泛舟', desc: '累计学习1小时', icon: '⏰', condition: (stats) => stats.totalStudyTime >= 3600 },
            { id: 'study_5h', name: '废寝忘食', desc: '累计学习5小时', icon: '🌙', condition: (stats) => stats.totalStudyTime >= 18000 },
            { id: 'study_10h', name: '悬梁刺股', desc: '累计学习10小时', icon: '📖', condition: (stats) => stats.totalStudyTime >= 36000 },
            { id: 'favorite_5', name: '收藏达人', desc: '收藏5道题目', icon: '❤️', condition: (stats) => stats.favoriteCount >= 5 },
            { id: 'exam_1', name: '初入考场', desc: '完成第一次模拟考试', icon: '🎓', condition: (stats) => stats.examCount >= 1 },
            { id: 'exam_5', name: '身经百战', desc: '完成5次模拟考试', icon: '🏅', condition: (stats) => stats.examCount >= 5 },
        ];
    }

    // 加载已解锁成就
    loadAchievements() {
        const saved = localStorage.getItem('java-quiz-achievements');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return [];
            }
        }
        return [];
    }

    // 保存成就
    saveAchievements() {
        localStorage.setItem('java-quiz-achievements', JSON.stringify(this.achievements));
    }

    // 检查并解锁成就
    checkAchievements(stats) {
        const newAchievements = [];

        this.definitions.forEach(def => {
            const alreadyUnlocked = this.achievements.some(a => a.id === def.id);
            if (!alreadyUnlocked && def.condition(stats)) {
                const achievement = {
                    id: def.id,
                    name: def.name,
                    desc: def.desc,
                    icon: def.icon,
                    unlockedAt: new Date().toISOString()
                };
                this.achievements.push(achievement);
                newAchievements.push(achievement);
            }
        });

        if (newAchievements.length > 0) {
            this.saveAchievements();
        }

        return newAchievements;
    }

    // 获取所有成就（包含解锁状态）
    getAllAchievements() {
        return this.definitions.map(def => {
            const unlocked = this.achievements.find(a => a.id === def.id);
            return {
                ...def,
                unlocked: !!unlocked,
                unlockedAt: unlocked ? unlocked.unlockedAt : null
            };
        });
    }

    // 获取已解锁成就数量
    getUnlockedCount() {
        return this.achievements.length;
    }

    // 获取总成就数量
    getTotalCount() {
        return this.definitions.length;
    }

    // 清除成就（用于测试）
    clearAchievements() {
        this.achievements = [];
        this.saveAchievements();
    }
}

// 题库管理器
class QuizBankManager {
    constructor() {
        this.customQuizBank = this.loadCustomQuizBank();
    }

    // 加载自定义题库
    loadCustomQuizBank() {
        const saved = localStorage.getItem('java-quiz-custom-bank');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // 保存自定义题库
    saveCustomQuizBank(bank) {
        this.customQuizBank = bank;
        localStorage.setItem('java-quiz-custom-bank', JSON.stringify(bank));
    }

    // 删除自定义题库
    deleteCustomQuizBank() {
        this.customQuizBank = null;
        localStorage.removeItem('java-quiz-custom-bank');
    }

    // 获取自定义题库
    getCustomQuizBank() {
        return this.customQuizBank;
    }

    // 是否有自定义题库
    hasCustomQuizBank() {
        return this.customQuizBank !== null;
    }

    // 获取题库名称
    getCustomQuizBankName() {
        return this.customQuizBank?.name || '自定义题库';
    }

    // 获取自定义题库题目数量
    getCustomQuizBankCount() {
        if (!this.customQuizBank) return 0;
        let count = 0;
        Object.values(this.customQuizBank.chapters).forEach(chapter => {
            count += chapter.questions.length;
        });
        return count;
    }

    // 验证题库格式
    validateQuizBank(data) {
        if (!data || typeof data !== 'object') {
            return { valid: false, error: '无效的JSON格式' };
        }

        if (!data.name || typeof data.name !== 'string') {
            return { valid: false, error: '缺少题库名称（name字段）' };
        }

        if (!data.chapters || typeof data.chapters !== 'object') {
            return { valid: false, error: '缺少章节数据（chapters字段）' };
        }

        // 验证每个章节
        for (const [key, chapter] of Object.entries(data.chapters)) {
            if (!chapter.name || typeof chapter.name !== 'string') {
                return { valid: false, error: `章节 ${key} 缺少名称` };
            }

            if (!Array.isArray(chapter.questions)) {
                return { valid: false, error: `章节 ${key} 缺少题目数组` };
            }

            // 验证每道题
            for (let i = 0; i < chapter.questions.length; i++) {
                const q = chapter.questions[i];
                const qNum = i + 1;

                if (!q.question || typeof q.question !== 'string') {
                    return { valid: false, error: `章节 ${key} 第 ${qNum} 题缺少题目内容` };
                }

                if (!['single', 'multi', 'judge', 'fill'].includes(q.type)) {
                    return { valid: false, error: `章节 ${key} 第 ${qNum} 题类型无效（应为 single/multi/judge/fill）` };
                }

                if (q.type === 'single' || q.type === 'multi') {
                    if (!Array.isArray(q.options) || q.options.length < 2) {
                        return { valid: false, error: `章节 ${key} 第 ${qNum} 题选项不足` };
                    }
                    if (q.answer === undefined || q.answer === null) {
                        return { valid: false, error: `章节 ${key} 第 ${qNum} 题缺少答案` };
                    }
                }

                if (q.type === 'judge') {
                    if (typeof q.answer !== 'boolean') {
                        return { valid: false, error: `章节 ${key} 第 ${qNum} 题答案应为 true/false` };
                    }
                }

                if (q.type === 'fill') {
                    if (!Array.isArray(q.answer) || q.answer.length === 0) {
                        return { valid: false, error: `章节 ${key} 第 ${qNum} 题答案应为数组` };
                    }
                }

                if (!q.explanation || typeof q.explanation !== 'string') {
                    return { valid: false, error: `章节 ${key} 第 ${qNum} 题缺少解析` };
                }
            }
        }

        return { valid: true };
    }

    // 导入题库
    importQuizBank(jsonString) {
        try {
            const data = JSON.parse(jsonString);
            const validation = this.validateQuizBank(data);

            if (!validation.valid) {
                return { error: validation.error };
            }

            this.saveCustomQuizBank(data);
            return { success: true, name: data.name, count: this.getCustomQuizBankCount() };
        } catch (e) {
            return { error: 'JSON解析失败：' + e.message };
        }
    }

    // 生成模板
    getTemplate() {
        return {
            name: "我的题库",
            chapters: {
                "chapter1": {
                    name: "第一章 示例章节",
                    questions: [
                        {
                            type: "single",
                            question: "这是一道单选题示例",
                            options: ["选项A", "选项B", "选项C", "选项D"],
                            answer: 0,
                            explanation: "这是解析，说明为什么选A",
                            difficulty: "easy"
                        },
                        {
                            type: "multi",
                            question: "这是一道多选题示例",
                            options: ["选项A", "选项B", "选项C", "选项D"],
                            answer: [0, 2],
                            explanation: "这是解析，说明为什么选A和C",
                            difficulty: "medium"
                        },
                        {
                            type: "judge",
                            question: "这是一道判断题示例",
                            answer: true,
                            explanation: "这是解析，说明为什么正确",
                            difficulty: "easy"
                        },
                        {
                            type: "fill",
                            question: "Java中用于定义类的关键字是_______",
                            answer: ["class"],
                            explanation: "Java使用class关键字定义类",
                            difficulty: "easy"
                        }
                    ]
                }
            }
        };
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

        // 历史记录管理器
        this.historyManager = new HistoryManager();

        // 成就管理器
        this.achievementManager = new AchievementManager();

        // 题库管理器
        this.quizBankManager = new QuizBankManager();

        // 当前使用的题库
        this.currentQuizBank = 'system'; // 'system' 或 'custom'

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
        this.initQuizBank();
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

    // 初始化题库
    initQuizBank() {
        // 检查是否有自定义题库
        if (this.quizBankManager.hasCustomQuizBank()) {
            const savedBank = localStorage.getItem('java-quiz-current-bank');
            this.currentQuizBank = savedBank || 'system';
        }

        this.updateQuizBankUI();
    }

    // 更新题库UI
    updateQuizBankUI() {
        const hasCustom = this.quizBankManager.hasCustomQuizBank();
        const customLabel = document.getElementById('custom-bank-label');
        const customName = document.getElementById('custom-bank-name');
        const deleteBtn = document.getElementById('delete-custom-quiz-btn');
        const info = document.getElementById('quiz-bank-info');

        if (hasCustom) {
            customLabel.style.display = 'flex';
            customName.textContent = `${this.quizBankManager.getCustomQuizBankName()}（${this.quizBankManager.getCustomQuizBankCount()}题）`;
            deleteBtn.style.display = 'inline-block';

            // 设置选中状态
            const radio = document.querySelector(`input[name="quiz-bank"][value="${this.currentQuizBank}"]`);
            if (radio) radio.checked = true;

            info.style.display = 'block';
            info.textContent = `当前使用：${this.currentQuizBank === 'system' ? '系统题库' : this.quizBankManager.getCustomQuizBankName()}`;
        } else {
            customLabel.style.display = 'none';
            deleteBtn.style.display = 'none';
            info.style.display = 'none';
            this.currentQuizBank = 'system';
        }
    }

    // 获取当前题库
    getCurrentQuestions() {
        if (this.currentQuizBank === 'custom' && this.quizBankManager.hasCustomQuizBank()) {
            return this.quizBankManager.getCustomQuizBank().chapters;
        }
        return questions;
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

        // 题库管理相关
        document.querySelectorAll('input[name="quiz-bank"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.currentQuizBank = e.target.value;
                localStorage.setItem('java-quiz-current-bank', this.currentQuizBank);
                this.updateQuizBankUI();
            });
        });

        document.getElementById('upload-quiz-btn').addEventListener('click', () => {
            document.getElementById('quiz-file-input').click();
        });

        document.getElementById('quiz-file-input').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const result = this.quizBankManager.importQuizBank(event.target.result);
                    if (result.error) {
                        alert('导入失败：' + result.error);
                    } else {
                        alert(`导入成功！题库"${result.name}"共${result.count}题`);
                        this.currentQuizBank = 'custom';
                        localStorage.setItem('java-quiz-current-bank', 'custom');
                        this.updateQuizBankUI();
                        this.loadChapterOptions();
                    }
                };
                reader.readAsText(file);
            }
            e.target.value = ''; // 清空input
        });

        document.getElementById('download-template-btn').addEventListener('click', () => {
            const template = this.quizBankManager.getTemplate();
            const blob = new Blob([JSON.stringify(template, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '题库模板.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        document.getElementById('delete-custom-quiz-btn').addEventListener('click', () => {
            if (confirm('确定要删除自定义题库吗？')) {
                this.quizBankManager.deleteCustomQuizBank();
                this.currentQuizBank = 'system';
                localStorage.setItem('java-quiz-current-bank', 'system');
                this.updateQuizBankUI();
                this.loadChapterOptions();
                alert('自定义题库已删除');
            }
        });

        // 收藏按钮（答题页）
        document.getElementById('favorite-question-btn').addEventListener('click', () => {
            this.toggleFavoriteCurrentQuestion();
        });

        // 历史记录相关
        document.getElementById('clear-history-btn').addEventListener('click', () => {
            if (confirm('确定要清除所有答题历史吗？')) {
                this.historyManager.clearHistory();
                this.renderHistory();
                alert('历史记录已清除！');
            }
        });

        document.getElementById('export-wrong-btn').addEventListener('click', () => {
            this.exportWrongQuestions();
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

        // 切换到历史标签页时渲染历史记录
        if (tabName === 'history') {
            this.renderHistory();
        }

        // 切换到成就标签页时渲染成就列表
        if (tabName === 'achievements') {
            this.renderAchievements();
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

        const currentQuestions = this.getCurrentQuestions();
        const results = [];
        Object.entries(currentQuestions).forEach(([chapterKey, chapter]) => {
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

    // 渲染答题历史
    renderHistory() {
        const history = this.historyManager.getHistory();
        const container = document.getElementById('history-list');

        if (history.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #888;">暂无答题记录</p>';
            return;
        }

        let html = '';
        history.forEach(record => {
            const date = new Date(record.date);
            const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')} ${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}`;

            const typeText = record.type === 'chapter' ? '章节练习' :
                             record.type === 'random' ? '随机刷题' :
                             record.type === 'exam' ? '模拟考试' : '练习';

            const typeClass = record.type || 'chapter';

            const percentage = record.total > 0 ? Math.round((record.correct / record.total) * 100) : 0;

            html += `
                <div class="history-item">
                    <div class="history-header">
                        <span class="history-date">${dateStr}</span>
                        <span class="history-type ${typeClass}">${typeText}</span>
                    </div>
                    <div class="history-score">${record.correct} / ${record.total} (${percentage}%)</div>
                    <div class="history-details">
                        ${record.chapterName || ''}
                        ${record.wrongCount > 0 ? ` | 错题: ${record.wrongCount}道` : ''}
                    </div>
                    <div class="history-actions">
                        <button class="btn btn-small" onclick="app.deleteHistoryRecord(${record.id})">删除</button>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 删除单条历史记录
    deleteHistoryRecord(id) {
        this.historyManager.deleteRecord(id);
        this.renderHistory();
    }

    // 渲染成就列表
    renderAchievements() {
        const achievements = this.achievementManager.getAllAchievements();
        const container = document.getElementById('achievement-list');
        const unlockedCount = this.achievementManager.getUnlockedCount();
        const totalCount = this.achievementManager.getTotalCount();

        document.getElementById('achievement-unlocked').textContent = unlockedCount;
        document.getElementById('achievement-total').textContent = totalCount;

        let html = '';
        achievements.forEach(a => {
            const dateStr = a.unlockedAt ?
                new Date(a.unlockedAt).toLocaleDateString() : '';

            html += `
                <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${a.icon}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${a.name}</div>
                        <div class="achievement-desc">${a.desc}</div>
                        ${a.unlocked ?
                            `<div class="achievement-date">解锁于 ${dateStr}</div>` :
                            `<div class="achievement-locked-text">未解锁</div>`
                        }
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // 检查并显示新成就
    checkAndShowAchievements() {
        const stats = {
            ...this.statsManager.getStats(),
            maxStreak: this.getMaxStreak(),
            chaptersCompleted: this.getCompletedChapters(),
            favoriteCount: this.favoriteManager.getCount(),
            examCount: this.getExamCount()
        };

        const newAchievements = this.achievementManager.checkAchievements(stats);

        // 显示新成就通知
        newAchievements.forEach((a, index) => {
            setTimeout(() => {
                this.showAchievementNotification(a);
            }, index * 1500);
        });
    }

    // 获取最大连续答对数
    getMaxStreak() {
        const saved = localStorage.getItem('java-quiz-max-streak');
        return saved ? parseInt(saved) : 0;
    }

    // 保存最大连续答对数
    saveMaxStreak(streak) {
        const current = this.getMaxStreak();
        if (streak > current) {
            localStorage.setItem('java-quiz-max-streak', streak.toString());
        }
    }

    // 获取已完成章节数
    getCompletedChapters() {
        const stats = this.statsManager.getStats();
        let count = 0;
        Object.values(stats.chapterStats).forEach(chapter => {
            if (chapter.answered > 0) count++;
        });
        return count;
    }

    // 获取模拟考试次数
    getExamCount() {
        const history = this.historyManager.getHistory();
        return history.filter(r => r.type === 'exam').length;
    }

    // 显示成就通知
    showAchievementNotification(achievement) {
        const notification = document.createElement('div');
        notification.className = 'achievement-notification';
        notification.innerHTML = `
            <div class="achievement-notification-content">
                <span class="achievement-notification-icon">${achievement.icon}</span>
                <div>
                    <div class="achievement-notification-title">🏆 成就解锁！</div>
                    <div class="achievement-notification-name">${achievement.name}</div>
                    <div class="achievement-notification-desc">${achievement.desc}</div>
                </div>
            </div>
        `;

        document.body.appendChild(notification);

        // 动画显示
        setTimeout(() => notification.classList.add('show'), 100);

        // 3秒后移除
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // 导出错题
    exportWrongQuestions() {
        const wrongQuestions = this.wrongQuestions;
        if (wrongQuestions.length === 0) {
            alert('没有错题可以导出！');
            return;
        }

        let content = 'Java期末考试 - 错题集\n';
        content += '========================\n\n';
        content += `导出时间：${new Date().toLocaleString()}\n`;
        content += `错题数量：${wrongQuestions.length}道\n\n`;

        wrongQuestions.forEach((q, index) => {
            content += `${index + 1}. ${q.question}\n`;
            content += `   难度：${this.getDifficultyText(q.difficulty) || '未知'}\n`;

            if (q.options) {
                q.options.forEach((opt, i) => {
                    content += `   ${String.fromCharCode(65+i)}. ${opt}\n`;
                });
            }

            content += `   正确答案：${this.getCorrectAnswerText(q)}\n`;
            content += `   解析：${q.explanation}\n`;
            content += '\n';
        });

        // 创建下载
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `错题集_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);

        alert('错题导出成功！');
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
        this.loadChapterOptions();
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
        const currentQuestions = this.getCurrentQuestions();
        const chapter = currentQuestions[chapterKey];
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

    // 加载章节选项
    loadChapterOptions() {
        const currentQuestions = this.getCurrentQuestions();
        const select = document.getElementById('chapter-select');

        // 清空现有选项
        select.innerHTML = '<option value="">-- 请选择章节 --</option>';

        // 添加新选项
        Object.entries(currentQuestions).forEach(([key, chapter]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${chapter.name}（${chapter.questions.length}题）`;
            select.appendChild(option);
        });

        // 清空章节信息
        document.getElementById('chapter-info').style.display = 'none';
        this.currentChapter = null;
    }

    // 开始章节练习
    startQuiz() {
        if (!this.currentChapter) {
            alert('请先选择章节！');
            return;
        }

        const currentQuestions = this.getCurrentQuestions();
        const chapter = currentQuestions[this.currentChapter];
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
        const currentQuestions = this.getCurrentQuestions();

        if (mode === 'all') {
            // 全部章节
            Object.values(currentQuestions).forEach(chapter => {
                availableQuestions.push(...chapter.questions);
            });
        } else {
            // 选中的章节
            document.querySelectorAll('#chapter-checkboxes input[type="checkbox"]:checked').forEach(cb => {
                const chapter = currentQuestions[cb.value];
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
        const currentQuestions = this.getCurrentQuestions();
        Object.values(currentQuestions).forEach(chapter => {
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

        // 追踪连续答对
        if (isCorrect) {
            this.currentStreak = (this.currentStreak || 0) + 1;
            this.saveMaxStreak(this.currentStreak);
            this.score++;
            const wrongIndex = this.wrongQuestions.findIndex(q => q.question === question.question);
            if (wrongIndex !== -1) {
                this.wrongQuestions.splice(wrongIndex, 1);
                this.saveWrongQuestions();
            }
        } else {
            this.currentStreak = 0;
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
        const currentQuestions = this.getCurrentQuestions();
        for (const [key, chapter] of Object.entries(currentQuestions)) {
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

        // 保存历史记录
        const record = {
            type: this.isExamMode ? 'exam' : (this.isReview ? 'chapter' : 'chapter'),
            total: totalAnswered,
            correct: this.score,
            wrongCount: this.wrongQuestions.length,
            chapterName: this.currentChapter ? questions[this.currentChapter]?.name : ''
        };

        if (this.isExamMode) {
            record.type = 'exam';
        } else if (this.isReview) {
            record.type = 'chapter';
        } else {
            record.type = this.currentChapter ? 'chapter' : 'random';
        }

        this.historyManager.addRecord(record);

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

        // 检查成就
        setTimeout(() => this.checkAndShowAchievements(), 500);
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
