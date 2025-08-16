import type { Express } from "express";
import { StrowalletAPIService } from "../strowallet-api";

export function registerStrowalletRoutes(app: Express) {
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