declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      role: string;
    };
  }
}
