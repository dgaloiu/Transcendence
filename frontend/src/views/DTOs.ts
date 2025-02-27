export class Ball
{
    dirX: number;
    dirY: number;
    x: number;
    y: number;
    speed: number;
}

export class gameBallDto{
    gameId: string;
    ball: Ball;
}

export class gamePaddleDto{
    myPaddlePos: number;
}

export class sideDto{
    gameId: string;
    my_side: string;
}

export class gameDto{
    gameId: string;
    playerOne: string;
}
