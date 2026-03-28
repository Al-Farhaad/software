import { body, param } from "express-validator";

export const loginValidator = [
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6, max: 100 }),
];

export const createSubAdminValidator = [
  body("name").trim().isLength({ min: 2, max: 80 }),
  body("email").isEmail().normalizeEmail(),
  body("password").isString().isLength({ min: 6, max: 100 }),
];

export const deleteSubAdminValidator = [
  param("id").isMongoId().withMessage("Valid sub-admin id is required."),
];

export const updateSignatureValidator = [
  body("signatureDataUrl")
    .optional({ nullable: true })
    .isString()
    .bail()
    .isLength({ max: 2000000 })
    .bail()
    .custom((value: string) => value.startsWith("data:image/"))
    .withMessage("Signature must be an image data URL."),
];
