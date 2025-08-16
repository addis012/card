import type { Express } from "express";
import { StrowalletAPIService } from "../strowallet-api";
import { storage } from "../hybrid-storage";
import { insertStrowalletCustomerSchema } from "@shared/schema";
import { z } from "zod";

export function registerStrowalletRoutes(app: Express) {
  // Get all StroWallet customers (for customer management page)
  app.get("/api/strowallet/customers", async (req, res) => {
    try {
      // Get customers from our local database
      const customers = await storage.getAllStrowalletCustomers();
      
      res.json(customers);
    } catch (error) {
      console.error("Error fetching StroWallet customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customers",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Create new StroWallet customer
  app.post("/api/strowallet/customers", async (req, res) => {
    try {
      const strowalletAPI = new StrowalletAPIService();
      
      // Validate the request data
      const validatedData = insertStrowalletCustomerSchema.parse({
        ...req.body,
        userId: req.session?.user?.id || 'default-user',
        publicKey: process.env.STROWALLET_PUBLIC_KEY || ""
      });

      // Create customer in StroWallet API
      let strowalletResult;
      try {
        strowalletResult = await strowalletAPI.createCustomer({
          houseNumber: validatedData.houseNumber,
          firstName: validatedData.firstName,
          lastName: validatedData.lastName,
          idNumber: validatedData.idNumber,
          customerEmail: validatedData.customerEmail,
          phoneNumber: validatedData.phoneNumber,
          dateOfBirth: validatedData.dateOfBirth,
          idImage: validatedData.idImage,
          userPhoto: validatedData.userPhoto,
          line1: validatedData.line1,
          state: validatedData.state,
          zipCode: validatedData.zipCode,
          city: validatedData.city,
          country: validatedData.country,
          idType: validatedData.idType as "BVN" | "NIN" | "PASSPORT"
        });
        
        console.log("StroWallet API response:", strowalletResult);
        
        // Update customer record with StroWallet customer ID if successful
        if (strowalletResult && strowalletResult.success === true && strowalletResult.response && strowalletResult.response.customerId) {
          validatedData.strowalletCustomerId = strowalletResult.response.customerId;
          validatedData.status = "created";
        } else if (strowalletResult && strowalletResult.success === false) {
          validatedData.status = "failed";
        } else {
          validatedData.status = "pending";
        }
      } catch (strowalletError) {
        console.error("StroWallet API error:", strowalletError);
        strowalletResult = {
          success: false,
          message: strowalletError instanceof Error ? strowalletError.message : "StroWallet API error"
        };
        validatedData.status = "failed";
      }

      // Save customer to our local database regardless of StroWallet success
      const customer = await storage.createStrowalletCustomer(validatedData);
      
      res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer: customer,
        strowalletResult: strowalletResult
      });

    } catch (error) {
      console.error("Error creating StroWallet customer:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: "Invalid customer data",
          errors: error.errors
        });
      }
      
      res.status(500).json({
        success: false,
        message: "Failed to create customer",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get all customers from StroWallet
  app.get("/api/admin/strowallet-customers", async (req, res) => {
    try {
      const strowalletAPI = new StrowalletAPIService();
      
      // Try to get customer data - note: StroWallet might not have a "list all customers" endpoint
      // This is a placeholder for when we integrate with their actual customer listing API
      const sampleCustomers = [
        {
          id: 1,
          name: "Addisu Admasu",
          email: "Addisumelke01@gmail.com",
          status: "High KYC",
          customerId: "546cd2b6-69be-4001-b78d-f617fc643764",
          country: "ET"
        },
        {
          id: 2,
          name: "Kalkidan Adamu", 
          email: "addisumelke04@gmail.com",
          status: "High KYC",
          customerId: "8023f891-9583-43be-9dd2-95b3b1ea52c6",
          country: "ET"
        },
        {
          id: 3,
          name: "Jane Doe",
          email: "jane.doe.test@example.com", 
          status: "Unreview KYC",
          customerId: "a9b8186a-fbe4-4372-b603-b04aebd38e53",
          country: "ET"
        }
      ];

      res.json({
        success: true,
        customers: sampleCustomers,
        total: sampleCustomers.length
      });

    } catch (error) {
      console.error("Error fetching StroWallet customers:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer data",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Get specific customer details from StroWallet
  app.get("/api/admin/strowallet-customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const strowalletAPI = new StrowalletAPIService();
      
      // Get customer details from StroWallet API
      const customerData = await strowalletAPI.getCustomer(customerId);
      
      res.json({
        success: true,
        customer: customerData
      });

    } catch (error) {
      console.error("Error fetching StroWallet customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch customer details",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Update customer KYC status through StroWallet API
  app.put("/api/admin/strowallet-customer/:customerId", async (req, res) => {
    try {
      const { customerId } = req.params;
      const updateData = req.body;
      const strowalletAPI = new StrowalletAPIService();
      
      // Update customer via StroWallet API
      const updatedCustomer = await strowalletAPI.updateCustomer(customerId, updateData);
      
      res.json({
        success: true,
        message: "Customer updated successfully",
        customer: updatedCustomer
      });

    } catch (error) {
      console.error("Error updating StroWallet customer:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update customer",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}