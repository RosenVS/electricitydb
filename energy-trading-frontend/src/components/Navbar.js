import React, { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import IconButton from "@mui/material/IconButton";
import AccountCircle from "@mui/icons-material/AccountCircle";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AddIcon from "@mui/icons-material/Add";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <AppBar position="static" sx={{ mb: 4 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, cursor: "pointer" }} onClick={() => navigate("/")}>
          Energy Trading Platform
        </Typography>
        {!isAuthenticated ? (
          <>
            <Button color="inherit" onClick={() => navigate("/login")}>Login</Button>
            <Button color="inherit" onClick={() => navigate("/register")}>Register</Button>
          </>
        ) : (
          <>
            <Button 
              color="inherit" 
              startIcon={<DashboardIcon />}
              onClick={() => navigate("/dashboard")}
            >
              Dashboard
            </Button>
            <Button 
              color="inherit" 
              startIcon={<ShoppingCartIcon />}
              onClick={() => navigate("/orders")}
            >
              Orders
            </Button>
            <Button 
              color="inherit" 
              startIcon={<StorefrontIcon />}
              onClick={() => navigate("/market")}
            >
              Market
            </Button>
            <Button 
              color="inherit" 
              startIcon={<ReceiptIcon />}
              onClick={() => navigate("/transactions")}
            >
              Transactions
            </Button>
            <Button 
              color="inherit" 
              startIcon={<AnalyticsIcon />}
              onClick={() => navigate("/statistics")}
            >
              Statistics
            </Button>
            <Button 
              color="inherit" 
              startIcon={<AddIcon />}
              onClick={() => navigate("/create-order")}
              sx={{ mr: 2 }}
            >
              Create Order
            </Button>
            <Button 
              color="inherit" 
              onClick={() => navigate("/debug")}
              sx={{ mr: 1 }}
            >
              Debug
            </Button>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { navigate("/profile"); handleClose(); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}