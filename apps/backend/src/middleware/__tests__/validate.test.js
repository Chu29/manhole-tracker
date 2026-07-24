import { jest } from '@jest/globals';
import { z } from "zod";
import { validate } from "../validate.js";

describe("Validate Middleware", () => {
  it("should call next() if validation passes", () => {
    const schema = z.object({
      name: z.string(),
    });
    
    const req = { body: { name: "Test" } };
    const res = {};
    const next = jest.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("should respond with 400 if validation fails", () => {
    const schema = z.object({
      name: z.string(),
    });
    
    const req = { body: { name: 123 } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    const middleware = validate(schema);
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Validation failed",
        details: expect.any(Array),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
