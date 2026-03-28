declare namespace Express {
  interface Request {
    auth?: {
      userId: string;
      role: "superadmin" | "subadmin";
      email: string;
      name: string;
    };
  }
}
