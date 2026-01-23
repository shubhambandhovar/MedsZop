const router=require("express").Router();
const auth=require("../middleware/authMiddleware");
const {getCart,addToCart,clearCart}=require("../controllers/cartController");

router.get("/",auth,getCart);
router.post("/add",auth,addToCart);
router.delete("/clear",auth,clearCart);

module.exports=router;
