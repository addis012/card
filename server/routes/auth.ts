import type { Express } from "express";
import { storage } from "../hybrid-storage";
import { StrowalletAPIService } from "../strowallet-api";
import { insertUserSchema, insertStrowalletCustomerSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";

// Extended registration schema
const fullRegistrationSchema = insertUserSchema.extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  // Strowallet customer fields
  publicKey: z.string(),
  customerEmail: z.string().email(), // This will be mapped to email field
  phoneNumber: z.string(),
  dateOfBirth: z.string(),
  idNumber: z.string(),
  idType: z.string(),
  houseNumber: z.string(),
  line1: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  country: z.string(),
  idImage: z.string(),
  userPhoto: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function registerAuthRoutes(app: Express) {
  // Simple user registration for testing
  app.post("/api/auth/register-simple", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Create user account
      const user = await storage.createUser(userData);

      res.status(201).json({
        message: "User created successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          kycStatus: user.kycStatus
        }
      });

    } catch (error) {
      console.error("Simple registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User registration with Strowallet integration
  app.post("/api/auth/register-full", async (req, res) => {
    try {
      const validatedData = fullRegistrationSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.customerEmail);
      if (existingUser) {
        return res.status(400).json({ message: "User with this email already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user account - map customerEmail to email
      const user = await storage.createUser({
        username: validatedData.username,
        password: hashedPassword,
        email: validatedData.customerEmail, // Map customerEmail to email field
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phoneNumber,
        role: 'user' as const,
        kycStatus: 'pending' as const
      });

      // Create Strowallet customer record
      try {
        const strowalletCustomer = await storage.createStrowalletCustomer({
          userId: user.id,
          publicKey: validatedData.publicKey,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          customerEmail: validatedData.customerEmail,
          phoneNumber: validatedData.phoneNumber,
          dateOfBirth: validatedData.dateOfBirth,
          idNumber: validatedData.idNumber,
          idType: validatedData.idType,
          houseNumber: validatedData.houseNumber,
          line1: validatedData.line1,
          city: validatedData.city,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          country: validatedData.country,
          idImage: validatedData.idImage,
          userPhoto: validatedData.userPhoto,
          status: 'pending'
        });

        // Try to create customer in Strowallet using official API
        const strowalletAPI = new StrowalletAPIService();
        try {
          const strowalletResponse = await strowalletAPI.createCustomer({
            houseNumber: validatedData.houseNumber,
            firstName: validatedData.firstName,
            lastName: validatedData.lastName,
            idNumber: validatedData.idNumber,
            customerEmail: validatedData.customerEmail,
            phoneNumber: StrowalletAPIService.formatPhoneNumber(validatedData.phoneNumber),
            dateOfBirth: StrowalletAPIService.formatDateOfBirth(validatedData.dateOfBirth),
            idImage: validatedData.idImage,
            userPhoto: validatedData.userPhoto,
            line1: validatedData.line1,
            state: validatedData.state,
            zipCode: validatedData.zipCode,
            city: validatedData.city,
            country: validatedData.country,
            idType: validatedData.idType as "BVN" | "NIN" | "PASSPORT"
          });

          // Update with Strowallet customer data
          await storage.updateStrowalletCustomer(strowalletCustomer.id, {
            strowalletCustomerId: strowalletResponse.customerId || strowalletResponse.id,
            status: 'created'
          });
          
          console.log("StroWallet customer created successfully:", strowalletResponse);

          // Update user KYC status to approved if Strowallet creation succeeded
          await storage.updateUser(user.id, { kycStatus: 'approved' });

        } catch (strowalletError) {
          console.error("Strowallet customer creation failed:", strowalletError);
          // Keep user account but mark Strowallet integration as failed
          await storage.updateStrowalletCustomer(strowalletCustomer.id, {
            status: 'failed'
          });
        }

        res.status(201).json({
          message: "Registration successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            kycStatus: user.kycStatus
          }
        });

      } catch (strowalletStorageError) {
        console.error("Failed to store Strowallet customer data:", strowalletStorageError);
        res.status(201).json({
          message: "User account created, but Strowallet integration failed",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            kycStatus: user.kycStatus
          }
        });
      }

    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Invalid registration data", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  // User login
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      // Find user by username or email
      const user = await storage.getUserByUsername(username) || await storage.getUserByEmail(username);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      };

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          kycStatus: user.kycStatus
        }
      });

    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check authentication status
  app.get("/api/auth/me", async (req, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      // Get full user data
      const user = await storage.getUser(req.session.user.id);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt
      });

    } catch (error) {
      console.error("Auth check error:", error);
      res.status(500).json({ message: "Authentication check failed" });
    }
  });

  // User logout
  app.post("/api/auth/logout", (req, res) => {
    if (req.session) {
      req.session.user = undefined;
    }
    res.json({ message: "Logged out successfully" });
  });

  // Get user's Strowallet customer data
  app.get("/api/strowallet/customer", async (req, res) => {
    try {
      if (!req.session?.user?.id) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const strowalletData = await storage.getStrowalletCustomerByUserId(req.session.user.id);
      res.json(strowalletData);

    } catch (error) {
      console.error("Failed to fetch Strowallet customer data:", error);
      res.status(500).json({ message: "Failed to fetch customer data" });
    }
  });
}