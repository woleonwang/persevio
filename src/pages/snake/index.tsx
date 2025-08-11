import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button, Card, Space, Typography, Row, Col, Statistic } from "antd";
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import styles from "./index.module.css";

const { Title, Text } = Typography;

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT";
  isGameOver: boolean;
  isPaused: boolean;
  score: number;
  highScore: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const SnakeGame: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: { x: 5, y: 5 },
    direction: "UP",
    isGameOver: false,
    isPaused: false,
    score: 0,
    highScore: parseInt(localStorage.getItem("snakeHighScore") || "0"),
  });

  const gameLoopRef = useRef<NodeJS.Timeout>();
  const lastDirectionRef = useRef<string>("UP");
  const isGameStartedRef = useRef<boolean>(false);

  // 生成随机食物位置
  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      snake.some(
        (segment) => segment.x === newFood.x && segment.y === newFood.y
      )
    );
    return newFood;
  }, []); // 移除依赖，避免无限循环

  // 检查碰撞
  const checkCollision = useCallback(
    (head: Position, snake: Position[]): boolean => {
      // 检查是否撞墙
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE
      ) {
        return true;
      }
      // 检查是否撞到自己（排除蛇头）
      return snake
        .slice(1)
        .some((segment) => segment.x === head.x && segment.y === head.y);
    },
    []
  );

  // 移动蛇
  const moveSnake = useCallback(() => {
    console.log("moveSnake called, gameState:", gameState);
    setGameState((prevState) => {
      if (prevState.isGameOver || prevState.isPaused) {
        console.log("Game paused or over, returning");
        return prevState;
      }

      const newSnake = [...prevState.snake];
      const head = { ...newSnake[0] };

      // 根据方向移动蛇头
      switch (prevState.direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      console.log("New head position:", head);

      // 检查碰撞
      if (checkCollision(head, newSnake)) {
        console.log("Collision detected!");
        return {
          ...prevState,
          isGameOver: true,
        };
      }

      newSnake.unshift(head);

      // 检查是否吃到食物
      let newFood = prevState.food;
      let newScore = prevState.score;
      let newHighScore = prevState.highScore;

      if (head.x === prevState.food.x && head.y === prevState.food.y) {
        console.log("Food eaten!");
        newFood = generateFood(newSnake);
        newScore += 10;
        if (newScore > newHighScore) {
          newHighScore = newScore;
          localStorage.setItem("snakeHighScore", newHighScore.toString());
        }
      } else {
        newSnake.pop();
      }

      const newState = {
        ...prevState,
        snake: newSnake,
        food: newFood,
        score: newScore,
        highScore: newHighScore,
      };

      console.log("New game state:", newState);
      return newState;
    });
  }, [checkCollision, generateFood]);

  // 暂停/继续游戏
  const togglePause = useCallback(() => {
    setGameState((prev) => {
      if (prev.isGameOver) return prev;

      const newIsPaused = !prev.isPaused;

      if (newIsPaused) {
        // 暂停游戏
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      } else {
        // 继续游戏
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
        gameLoopRef.current = setInterval(moveSnake, 150);
      }

      return { ...prev, isPaused: newIsPaused };
    });
  }, [moveSnake]);

  // 处理键盘输入
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      event.preventDefault();
      const key = event.key;
      const currentDirection = gameState.direction;

      // 防止反向移动
      if (
        (key === "ArrowUp" && currentDirection !== "DOWN") ||
        (key === "ArrowDown" && currentDirection !== "UP") ||
        (key === "ArrowLeft" && currentDirection !== "RIGHT") ||
        (key === "ArrowRight" && currentDirection !== "LEFT")
      ) {
        const newDirection =
          key === "ArrowUp"
            ? "UP"
            : key === "ArrowDown"
            ? "DOWN"
            : key === "ArrowLeft"
            ? "LEFT"
            : "RIGHT";

        if (lastDirectionRef.current !== newDirection) {
          setGameState((prev) => ({ ...prev, direction: newDirection }));
          lastDirectionRef.current = newDirection;
        }
      }

      // 空格键暂停/继续
      if (key === " ") {
        event.preventDefault();
        togglePause();
      }
    },
    [gameState.direction, togglePause]
  );

  // 开始游戏
  const startGame = useCallback(() => {
    console.log("startGame called");
    if (gameState.isGameOver) {
      console.log("Resetting game state");
      setGameState({
        snake: INITIAL_SNAKE,
        food: generateFood(INITIAL_SNAKE),
        direction: "UP",
        isGameOver: false,
        isPaused: false,
        score: 0,
        highScore: gameState.highScore,
      });
      lastDirectionRef.current = "UP";
    }

    if (gameLoopRef.current) {
      console.log("Clearing existing game loop");
      clearInterval(gameLoopRef.current);
    }

    console.log("Starting new game loop");
    gameLoopRef.current = setInterval(moveSnake, 150);
    isGameStartedRef.current = true;
  }, [gameState.isGameOver, gameState.highScore, generateFood, moveSnake]);

  // 重置游戏
  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }
    setGameState({
      snake: INITIAL_SNAKE,
      food: generateFood(INITIAL_SNAKE),
      direction: "UP",
      isGameOver: false,
      isPaused: false,
      score: 0,
      highScore: gameState.highScore,
    });
    lastDirectionRef.current = "UP";
    isGameStartedRef.current = false;
  }, [gameState.highScore, generateFood]);

  // 设置键盘事件监听
  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  // 自动开始游戏
  useEffect(() => {
    // 页面加载后立即开始游戏
    const timer = setTimeout(() => {
      if (!isGameStartedRef.current) {
        startGame();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [startGame]);

  // 清理游戏循环
  useEffect(() => {
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, []);

  // 渲染游戏网格
  const renderGrid = () => {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const isSnake = gameState.snake.some(
          (segment) => segment.x === x && segment.y === y
        );
        const isFood = gameState.food.x === x && gameState.food.y === y;
        const isHead =
          gameState.snake[0]?.x === x && gameState.snake[0]?.y === y;

        let cellClass = styles.gridCell;
        if (isSnake) {
          cellClass += ` ${isHead ? styles.snakeHead : styles.snakeBody}`;
        } else if (isFood) {
          cellClass += ` ${styles.food}`;
        }

        grid.push(
          <div
            key={`${x}-${y}`}
            className={cellClass}
            style={{
              left: `${x * 20}px`,
              top: `${y * 20}px`,
            }}
          />
        );
      }
    }
    return grid;
  };

  return (
    <div className={styles.snakeGameContainer}>
      <Row gutter={[24, 24]} justify="center">
        <Col xs={24} lg={16}>
          <Card>
            <div className={styles.gameHeader}>
              <Title level={2} className={styles.gameTitle}>
                贪吃蛇游戏
              </Title>
              <Space size="large">
                <Statistic title="当前分数" value={gameState.score} />
                <Statistic title="最高分数" value={gameState.highScore} />
              </Space>
            </div>

            <div className={styles.gameControls}>
              <Space>
                {!gameState.isGameOver ? (
                  <>
                    {gameState.isPaused ? (
                      <Button
                        type="primary"
                        icon={<PlayCircleOutlined />}
                        onClick={togglePause}
                        size="large"
                      >
                        继续
                      </Button>
                    ) : (
                      <Button
                        icon={<PauseCircleOutlined />}
                        onClick={togglePause}
                        size="large"
                      >
                        暂停
                      </Button>
                    )}
                  </>
                ) : (
                  <Button
                    type="primary"
                    icon={<PlayCircleOutlined />}
                    onClick={startGame}
                    size="large"
                  >
                    开始游戏
                  </Button>
                )}
                <Button
                  icon={<ReloadOutlined />}
                  onClick={resetGame}
                  size="large"
                >
                  重置
                </Button>
              </Space>
            </div>

            {/* 调试信息 */}
            <div
              style={{
                textAlign: "center",
                marginBottom: "16px",
                fontSize: "12px",
                color: "#666",
              }}
            >
              <div>
                游戏状态:{" "}
                {gameState.isGameOver
                  ? "游戏结束"
                  : gameState.isPaused
                  ? "已暂停"
                  : "进行中"}
              </div>
              <div>
                蛇头位置: ({gameState.snake[0]?.x}, {gameState.snake[0]?.y})
              </div>
              <div>移动方向: {gameState.direction}</div>
              <div>蛇长度: {gameState.snake.length}</div>
            </div>

            <div className={styles.gameBoard}>
              <div className={styles.gameGrid}>{renderGrid()}</div>
              {gameState.isGameOver && (
                <div className={styles.gameOver}>
                  <Title level={3}>游戏结束!</Title>
                  <Text>最终分数: {gameState.score}</Text>
                  <br />
                  <Button
                    type="primary"
                    onClick={startGame}
                    style={{ marginTop: 16 }}
                  >
                    重新开始
                  </Button>
                </div>
              )}
            </div>

            <div className={styles.gameInstructions}>
              <Title level={4}>游戏说明</Title>
              <ul>
                <li>使用方向键控制蛇的移动</li>
                <li>空格键暂停/继续游戏</li>
                <li>吃到食物可以增加分数和蛇的长度</li>
                <li>避免撞墙和撞到自己</li>
              </ul>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SnakeGame;
