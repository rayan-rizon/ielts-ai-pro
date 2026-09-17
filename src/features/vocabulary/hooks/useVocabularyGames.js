import { useState, useCallback } from 'react';

export const playableWords = (words) =>
  words.filter(
    (item) =>
      item?.word?.trim() &&
      item?.definition?.trim() &&
      !/^(saved ielts vocabulary word|no definition)$/i.test(item.definition.trim())
  );

/**
 * Custom hook for Speed Quiz game logic
 */
export function useSpeedQuiz({ allVocabulary }) {
  const [activeGame, setActiveGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameState, setGameState] = useState('menu');

  const startSpeedQuiz = useCallback(() => {
    const words = playableWords(allVocabulary);
    if (words.length < 4) {
      return { success: false, error: 'Save at least 4 words with definitions to play.' };
    }

    // Shuffle and pick words
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const quizWords = shuffled.slice(0, Math.min(10, shuffled.length));

    const questions = quizWords
      .filter((word) => word && word.word)
      .map((word) => {
        // Get wrong answers from other words
        const otherWords = words.filter((w) => w.id !== word.id);
        const wrongAnswers = otherWords
          .sort(() => Math.random() - 0.5)
          .slice(0, 3)
          .map((w) => w.definition);

        const options = [...wrongAnswers, word.definition].sort(() => Math.random() - 0.5);

        return {
          word: word.word,
          correctAnswer: word.definition,
          options,
        };
      });

    setGameData({
      questions,
      currentIndex: 0,
      correctCount: 0,
      startTime: Date.now(),
    });
    setGameScore(0);
    setGameState('playing');
    setActiveGame('speed-quiz');

    return { success: true };
  }, [allVocabulary]);

  const handleQuizAnswer = useCallback(
    (answer) => {
      if (!gameData) return;

      const currentQuestion = gameData.questions[gameData.currentIndex];
      const isCorrect = answer === currentQuestion.correctAnswer;

      const newCorrectCount = isCorrect ? gameData.correctCount + 1 : gameData.correctCount;
      const newIndex = gameData.currentIndex + 1;

      if (newIndex >= gameData.questions.length) {
        // Quiz finished
        setGameScore(newCorrectCount);
        setGameState('finished');
        setGameData(null);
      } else {
        setGameData({
          ...gameData,
          currentIndex: newIndex,
          correctCount: newCorrectCount,
        });
      }

      return { isCorrect, correctCount: newCorrectCount };
    },
    [gameData]
  );

  const closeGame = useCallback(() => {
    setActiveGame(null);
    setGameData(null);
    setGameScore(0);
    setGameState('menu');
  }, []);

  return {
    activeGame,
    gameData,
    gameScore,
    gameState,
    startSpeedQuiz,
    handleQuizAnswer,
    closeGame,
    isSpeedQuizOpen: activeGame === 'speed-quiz',
  };
}

/**
 * Custom hook for Match Pairs game logic
 */
export function useMatchPairs({ allVocabulary }) {
  const [activeGame, setActiveGame] = useState(null);
  const [gameData, setGameData] = useState(null);
  const [gameScore, setGameScore] = useState(0);
  const [gameState, setGameState] = useState('menu');

  const startMatchPairs = useCallback(() => {
    const words = playableWords(allVocabulary);
    if (words.length < 4) {
      return { success: false, error: 'Save at least 4 words with definitions to play.' };
    }

    // Pick 6 words for 12 cards (6 pairs)
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(6, shuffled.length));

    // Create pairs: word cards and definition cards
    const cards = [];
    selectedWords.forEach((word, index) => {
      cards.push({
        id: `word-${index}`,
        pairId: index,
        type: 'word',
        content: word.word,
        isFlipped: false,
        isMatched: false,
      });
      cards.push({
        id: `def-${index}`,
        pairId: index,
        type: 'definition',
        content: word.definition,
        isFlipped: false,
        isMatched: false,
      });
    });

    // Shuffle cards
    const shuffledCards = cards.sort(() => Math.random() - 0.5);

    setGameData({
      cards: shuffledCards,
      flippedCards: [],
      matchedPairs: 0,
      totalPairs: selectedWords.length,
      moves: 0,
    });
    setGameScore(0);
    setGameState('playing');
    setActiveGame('match-pairs');

    return { success: true };
  }, [allVocabulary]);

  const handleCardClick = useCallback(
    (clickedCard) => {
      if (!gameData) return;
      if (clickedCard.isFlipped || clickedCard.isMatched) return;
      if (gameData.flippedCards.length >= 2) return;

      const newCards = gameData.cards.map((card) =>
        card.id === clickedCard.id ? { ...card, isFlipped: true } : card
      );

      const newFlippedCards = [...gameData.flippedCards, clickedCard];

      if (newFlippedCards.length === 2) {
        const [first, second] = newFlippedCards;
        const isMatch = first.pairId === second.pairId && first.type !== second.type;

        if (isMatch) {
          // Mark as matched
          const matchedCards = newCards.map((card) =>
            card.pairId === first.pairId ? { ...card, isMatched: true, isFlipped: true } : card
          );

          const newMatchedPairs = gameData.matchedPairs + 1;

          if (newMatchedPairs === gameData.totalPairs) {
            // Game finished
            setGameScore(gameData.totalPairs);
            setGameState('finished');
          }

          setGameData({
            ...gameData,
            cards: matchedCards,
            flippedCards: [],
            matchedPairs: newMatchedPairs,
            moves: gameData.moves + 1,
          });
        } else {
          // No match - flip back after delay
          setGameData({
            ...gameData,
            cards: newCards,
            flippedCards: newFlippedCards,
            moves: gameData.moves + 1,
          });

          setTimeout(() => {
            setGameData((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                cards: prev.cards.map((card) =>
                  !card.isMatched && (card.id === first.id || card.id === second.id)
                    ? { ...card, isFlipped: false }
                    : card
                ),
                flippedCards: [],
              };
            });
          }, 1000);
        }
      } else {
        setGameData({
          ...gameData,
          cards: newCards,
          flippedCards: newFlippedCards,
        });
      }
    },
    [gameData]
  );

  const closeGame = useCallback(() => {
    setActiveGame(null);
    setGameData(null);
    setGameScore(0);
    setGameState('menu');
  }, []);

  return {
    activeGame,
    gameData,
    gameScore,
    gameState,
    startMatchPairs,
    handleCardClick,
    closeGame,
    isMatchPairsOpen: activeGame === 'match-pairs',
  };
}
