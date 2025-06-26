document.addEventListener('DOMContentLoaded', () => {
    // === SELEÇÃO DE ELEMENTOS DO DOM ===
    const screens = {
        settings: document.getElementById('settings-screen'),
        game: document.getElementById('game-screen'),
        results: document.getElementById('results-screen'),
    };
    
    const settings = {
        difficulty: document.getElementById('difficulty'),
        numQuestions: document.getElementById('num-questions'),
        opCheckboxes: document.querySelectorAll('.operations input[type="checkbox"]'),
        startBtn: document.getElementById('start-btn'),
    };

    const game = {
        scoreDisplay: document.getElementById('score'),
        currentQDisplay: document.getElementById('current-q'),
        totalQDisplay: document.getElementById('total-q'),
        problemDisplay: document.getElementById('problem'),
        answerInput: document.getElementById('answer-input'),
        feedback: document.getElementById('feedback'),
        progressBar: document.getElementById('progress-bar'),
        progressBarContainer: document.getElementById('progress-bar-container'),
    };
    
    const results = {
        finalScoreDisplay: document.getElementById('final-score'),
        playAgainBtn: document.getElementById('play-again-btn'),
    };

    const leaderboard = {
        modal: document.getElementById('leaderboard-modal'),
        playerNameInput: document.getElementById('player-name'),
        saveScoreBtn: document.getElementById('save-score-btn'),
        display: document.getElementById('leaderboard-display'),
        content: document.getElementById('leaderboard-content'),
    };

    // === VARIÁVEIS DE ESTADO DO JOGO ===
    let state = {
        score: 0,
        currentQuestionIndex: 0,
        totalQuestions: 20,
        difficulty: 2,
        isInfinite: false,
        currentProblem: null,
        questionStartTime: 0,
        leaderboardData: {},
        selectedOps: ['+', '-', '*', '/'],
    };

    // === LÓGICA DO JOGO ===

    const switchScreen = (screenName) => {
        Object.values(screens).forEach(screen => screen.classList.remove('active'));
        screens[screenName].classList.add('active');
    };

    const generateNumber = (digits) => {
        const min = Math.pow(10, digits - 1);
        const max = Math.pow(10, digits) - 1;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    const generateProblem = () => {
        const op = state.selectedOps[Math.floor(Math.random() * state.selectedOps.length)];
        let num1 = generateNumber(state.difficulty);
        let num2 = generateNumber(state.difficulty);
        let question = '';
        let answer = 0;

        switch (op) {
            case '+':
                answer = num1 + num2;
                question = `${num1} + ${num2}`;
                break;
            case '-':
                // Garante que o resultado não seja negativo
                if (num1 < num2) [num1, num2] = [num2, num1];
                answer = num1 - num2;
                question = `${num1} - ${num2}`;
                break;
            case '*':
                answer = num1 * num2;
                question = `${num1} × ${num2}`;
                break;
            case '/':
                 // Garante que o resultado seja inteiro
                const result = generateNumber(state.difficulty > 1 ? 1 : 1); // Gera um resultado simples
                num2 = generateNumber(state.difficulty > 1 ? state.difficulty -1 : 1);
                num1 = result * num2;
                answer = result;
                question = `${num1} ÷ ${num2}`;
                break;
        }
        return { question, answer };
    };

    const nextQuestion = () => {
        if (!state.isInfinite && state.currentQuestionIndex >= state.totalQuestions) {
            endGame();
            return;
        }
        
        state.currentQuestionIndex++;
        updateGameHeader();
        
        state.currentProblem = generateProblem();
        game.problemDisplay.textContent = state.currentProblem.question;
        game.answerInput.value = '';
        game.answerInput.focus();
        state.questionStartTime = Date.now();
    };

    const checkAnswer = () => {
        const userAnswer = parseInt(game.answerInput.value, 10);
        const isCorrect = userAnswer === state.currentProblem.answer;

        if (isCorrect) {
            // Pontuação: Base 1000, diminui com o tempo. Mínimo 50 pontos.
            const timeTaken = (Date.now() - state.questionStartTime) / 1000; // em segundos
            const points = Math.max(50, Math.floor(1000 - timeTaken * 50));
            state.score += points;
            game.scoreDisplay.textContent = state.score;
            showFeedback(true);
            // Tocar som de acerto
        } else {
            showFeedback(false);
            // Tocar som de erro
        }
    };
    
    const showFeedback = (isCorrect) => {
        game.feedback.textContent = isCorrect ? '✓' : '✗';
        game.feedback.className = isCorrect ? 'correct' : 'wrong';
        game.feedback.classList.add('show');
        
        setTimeout(() => {
            game.feedback.classList.remove('show');
            nextQuestion();
        }, 200); // Feedback visível por 0.2 segundos
    };
    
    const updateGameHeader = () => {
        game.currentQDisplay.textContent = state.currentQuestionIndex;
        if(state.isInfinite) {
            game.totalQDisplay.textContent = '∞';
            game.progressBarContainer.style.display = 'none';
        } else {
            game.totalQDisplay.textContent = state.totalQuestions;
            game.progressBarContainer.style.display = 'block';
            game.progressBar.style.width = `${(state.currentQuestionIndex / state.totalQuestions) * 100}%`;
        }
    };

    const startGame = () => {
        // Obter configurações
        state.difficulty = parseInt(settings.difficulty.value, 10);
        const numQValue = settings.numQuestions.value;
        state.isInfinite = numQValue === 'Infinity';
        state.totalQuestions = state.isInfinite ? 0 : parseInt(numQValue, 10);
        state.selectedOps = Array.from(settings.opCheckboxes)
                                .filter(cb => cb.checked)
                                .map(cb => cb.value);

        if (state.selectedOps.length === 0) {
            alert("Por favor, selecione pelo menos uma operação!");
            return;
        }

        // Resetar estado
        state.score = 0;
        state.currentQuestionIndex = 0;
        game.scoreDisplay.textContent = '0';
        
        switchScreen('game');
        nextQuestion();
    };

    const endGame = () => {
        switchScreen('results');
        // Tocar som de celebração
        triggerConfetti();
        animateScore();
        checkLeaderboard();
    };
    
    const triggerConfetti = () => {
        const canvas = document.getElementById('confetti-canvas');
        const myConfetti = confetti.create(canvas, { resize: true });
        
        const duration = 2 * 1000;
        const end = Date.now() + duration;

        (function frame() {
            myConfetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
            });
            myConfetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());
    };

    const animateScore = () => {
        let currentScore = 0;
        const finalScore = state.score;
        results.finalScoreDisplay.textContent = 0;
        results.finalScoreDisplay.classList.remove('bouncing');

        if (finalScore === 0) {
            results.finalScoreDisplay.classList.add('bouncing');
            return;
        }

        const increment = Math.max(1, Math.floor(finalScore / 100));
        const interval = setInterval(() => {
            currentScore += increment;
            if (currentScore >= finalScore) {
                currentScore = finalScore;
                clearInterval(interval);
                results.finalScoreDisplay.classList.add('bouncing');
            }
            results.finalScoreDisplay.textContent = currentScore;
        }, 15);
    };

    // === LÓGICA DO RANKING (LEADERBOARD) ===

    const getLeaderboardKey = () => {
        const qCount = state.isInfinite ? 'inf' : state.totalQuestions;
        return `d${state.difficulty}-q${qCount}`;
    };
    
    const loadLeaderboard = () => {
        const data = localStorage.getItem('mentalMathLeaderboard');
        state.leaderboardData = data ? JSON.parse(data) : {};
    };

    const saveLeaderboard = () => {
        localStorage.setItem('mentalMathLeaderboard', JSON.stringify(state.leaderboardData));
    };


    const checkLeaderboard = () => {
        const key = getLeaderboardKey();
        const scores = state.leaderboardData[key] || [];
        
        if (scores.length < 10 || state.score > scores[scores.length - 1].score) {
            setTimeout(() => {
                leaderboard.modal.classList.add('active');
                leaderboard.playerNameInput.focus();
            }, 1000); // Espera 1s para o modal aparecer
        }
    };
    
    const saveScoreToLeaderboard = () => {
        const name = leaderboard.playerNameInput.value.trim();
        if (name.length < 3) {
            alert("O nome precisa ter pelo menos 3 caracteres.");
            return;
        }

        const key = getLeaderboardKey();
        const scores = state.leaderboardData[key] || [];
        
        scores.push({ name, score: state.score });
        scores.sort((a, b) => b.score - a.score); // Ordena do maior para o menor
        state.leaderboardData[key] = scores.slice(0, 10); // Mantém apenas o Top 10

        saveLeaderboard();
        leaderboard.modal.classList.remove('active');
        leaderboard.playerNameInput.value = '';
        updateLeaderboardDisplay();
    };

    const updateLeaderboardDisplay = () => {
        const difficulty = settings.difficulty.value;
        const numQ = settings.numQuestions.value;
        const qCount = numQ === 'Infinity' ? 'inf' : numQ;
        const key = `d${difficulty}-q${qCount}`;
        
        const scores = state.leaderboardData[key] || [];

        if (scores.length === 0) {
            leaderboard.content.innerHTML = '<p>Ainda não há recordes para esta categoria. Seja o primeiro!</p>';
            return;
        }
        
        let html = '';
        scores.forEach((entry, index) => {
            html += `${(index + 1).toString().padStart(2, ' ')}. ${entry.name.padEnd(10, ' ')} - ${entry.score} pts\n`;
        });
        leaderboard.content.textContent = html;
    };


    // === EVENT LISTENERS ===
    settings.startBtn.addEventListener('click', startGame);

    game.answerInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            checkAnswer();
        }
    });
    
    results.playAgainBtn.addEventListener('click', () => {
        switchScreen('settings');
        updateLeaderboardDisplay();
    });

    leaderboard.saveScoreBtn.addEventListener('click', saveScoreToLeaderboard);
    leaderboard.playerNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            saveScoreToLeaderboard();
        }
    });

    // Atualiza o display do ranking quando as configurações mudam
    settings.difficulty.addEventListener('change', updateLeaderboardDisplay);
    settings.numQuestions.addEventListener('change', updateLeaderboardDisplay);

    // === INICIALIZAÇÃO ===
    loadLeaderboard();
    updateLeaderboardDisplay();
    switchScreen('settings');
});