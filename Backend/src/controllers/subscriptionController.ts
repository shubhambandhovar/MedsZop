import { Request, Response } from 'express';
import { SubscriptionPlan, Subscription, DoctorConsultation } from '../models/Subscription';

// ============================================
// SUBSCRIPTION PLANS
// ============================================

export const getSubscriptionPlans = async (req: Request, res: Response) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true });
    res.json({
      success: true,
      plans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createSubscriptionPlan = async (req: Request, res: Response) => {
  try {
    const { name, type, description, price, medicines, doctorConsultsPerMonth, features } =
      req.body;

    const newPlan = new SubscriptionPlan({
      name,
      type,
      description,
      price,
      medicines,
      doctorConsultsPerMonth: doctorConsultsPerMonth || 0,
      features,
    });

    await newPlan.save();
    res.status(201).json({
      success: true,
      message: 'Subscription plan created',
      plan: newPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// USER SUBSCRIPTIONS
// ============================================

export const getUserSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const subscription = await Subscription.findOne({ userId, status: 'active' }).populate(
      'planId'
    );

    if (!subscription) {
      return res.json({
        success: true,
        subscription: null,
      });
    }

    res.json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const { userId, planId, medicines, paymentMethodId } = req.body;

    // Check if user already has active subscription
    const existingSubscription = await Subscription.findOne({ userId, status: 'active' });
    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription',
      });
    }

    // Get plan details
    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan not found',
      });
    }

    const startDate = new Date();
    const nextBillingDate = new Date(startDate);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const newSubscription = new Subscription({
      userId,
      planId,
      planType: plan.type,
      medicines,
      totalAmount: plan.price,
      nextBillingDate,
      autoPaymentEnabled: true,
      paymentMethodId,
      doctorConsultsLeft: plan.doctorConsultsPerMonth || 0,
      doctorConsultsUsed: 0,
    });

    await newSubscription.save();

    // Initialize payment (In real implementation, trigger Razorpay API)
    // TODO: Integrate with Razorpay Subscription API

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription: newSubscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSubscriptionMedicines = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { medicines } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { medicines },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription medicines updated',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const pauseSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { pauseUntilDate } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'paused',
        pausedUntil: new Date(pauseUntilDate),
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription paused',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const resumeSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'active',
        pausedUntil: undefined,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription resumed',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const skipSubscriptionMonth = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found',
      });
    }

    subscription.skippedMonths.push(new Date());

    // Move next billing date by 1 month
    const nextBilling = new Date(subscription.nextBillingDate);
    nextBilling.setMonth(nextBilling.getMonth() + 1);
    subscription.nextBillingDate = nextBilling;

    await subscription.save();

    res.json({
      success: true,
      message: 'Month skipped successfully',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelSubscription = async (req: Request, res: Response) => {
  try {
    const { subscriptionId } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Subscription cancelled',
      subscription,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// DOCTOR CONSULTATIONS (Premium only)
// ============================================

export const createDoctorConsultation = async (req: Request, res: Response) => {
  try {
    const { subscriptionId, userId, consultationType, reason, scheduledDate } = req.body;

    // Check if subscription is premium
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription || subscription.planType !== 'premium') {
      return res.status(400).json({
        success: false,
        message: 'Only premium subscribers can book doctor consultations',
      });
    }

    // Check if consultations left
    if (subscription.doctorConsultsLeft <= subscription.doctorConsultsUsed) {
      return res.status(400).json({
        success: false,
        message: 'No consultations left for this month',
      });
    }

    const consultation = new DoctorConsultation({
      subscriptionId,
      userId,
      consultationType,
      reason,
      scheduledDate: new Date(scheduledDate),
      status: 'scheduled',
    });

    await consultation.save();

    // Increment used consultations
    subscription.doctorConsultsUsed += 1;
    await subscription.save();

    res.status(201).json({
      success: true,
      message: 'Doctor consultation scheduled',
      consultation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getUserConsultations = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;

    const consultations = await DoctorConsultation.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      consultations,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const completeConsultation = async (req: Request, res: Response) => {
  try {
    const { consultationId } = req.params;
    const { notes, prescription } = req.body;

    const consultation = await DoctorConsultation.findByIdAndUpdate(
      consultationId,
      {
        status: 'completed',
        completedAt: new Date(),
        notes,
        prescription,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Consultation completed',
      consultation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const cancelConsultation = async (req: Request, res: Response) => {
  try {
    const { consultationId } = req.params;

    const consultation = await DoctorConsultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found',
      });
    }

    // Decrement used consultations
    const subscription = await Subscription.findById(consultation.subscriptionId);
    if (subscription && consultation.status === 'scheduled') {
      subscription.doctorConsultsUsed -= 1;
      subscription.doctorConsultsLeft += 1;
      await subscription.save();
    }

    consultation.status = 'cancelled';
    await consultation.save();

    res.json({
      success: true,
      message: 'Consultation cancelled',
      consultation,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// CRON JOB - Auto create orders & send notifications
// ============================================

export const processSubscriptionBillings = async (req: Request, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active subscriptions with billing date today
    const subscriptions = await Subscription.find({
      status: 'active',
      nextBillingDate: { $lte: today },
    }).populate('userId');

    for (const subscription of subscriptions) {
      // TODO: Charge via Razorpay
      // TODO: Create automatic order
      // TODO: Assign nearest pharmacy
      // TODO: Send notification to user

      // Move next billing date to next month
      const nextBilling = new Date(subscription.nextBillingDate);
      nextBilling.setMonth(nextBilling.getMonth() + 1);
      subscription.nextBillingDate = nextBilling;

      // Reset doctor consultations for the month
      subscription.doctorConsultsUsed = 0;
      subscription.doctorConsultsLeft = subscription.doctorConsultsLeft;

      await subscription.save();
    }

    res.json({
      success: true,
      message: `Processed ${subscriptions.length} subscriptions`,
      processedCount: subscriptions.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
