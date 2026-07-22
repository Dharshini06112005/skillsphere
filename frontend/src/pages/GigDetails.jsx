import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import {
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Layers,
  FileText,
  User,
  Clock,
  Send,
  Loader2,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Star
} from 'lucide-react';

const GigDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Data states
  const [gig, setGig] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [myProposal, setMyProposal] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Freelancer proposal form inputs
  const [bidAmount, setBidAmount] = useState('');
  const [completionTime, setCompletionTime] = useState('');
  const [description, setDescription] = useState('');

  // Checkout modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [checkoutMilestone, setCheckoutMilestone] = useState(null);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  // Dispute modal states
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeMilestoneId, setDisputeMilestoneId] = useState('');
  const [disputeReason, setDisputeReason] = useState('');

  // UI status
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Negotiation & Invite states
  const [negotiatingPropId, setNegotiatingPropId] = useState(null);
  const [counterOfferVal, setCounterOfferVal] = useState('');

  // Freelancer profile modal & booking states
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState(null);
  const [bookingDay, setBookingDay] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');

  // Rating & Review states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [hasSubmittedReview, setHasSubmittedReview] = useState(false);

  // Deliverables states
  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [deliverMilestoneId, setDeliverMilestoneId] = useState('');
  const [deliverNotes, setDeliverNotes] = useState('');
  const [deliverUrl, setDeliverUrl] = useState('');

  useEffect(() => {
    loadGigData();
  }, [id]);

  const loadGigData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Load Gig Details
      const gigRes = await API.get(`/gigs/${id}`);
      if (gigRes.data.success) {
        setGig(gigRes.data.gig);
        const gigData = gigRes.data.gig;
        const isOwner = user?._id === gigData.client?._id;

        // 2. Load Proposals & Matching Recommendations for Client
        if (user?.role === 'client' && isOwner) {
          const propRes = await API.get(`/proposals/gig/${id}`);
          if (propRes.data.success) {
            setProposals(propRes.data.proposals);
          }
          
          // Fetch Jaccard AI skill recommendations
          const matchRes = await API.get(`/match/recommendations/${id}`);
          if (matchRes.data.success) {
            setRecommendations(matchRes.data.matches);
          }
        } else if (user?.role === 'freelancer') {
          // Fetch freelancer bid status
          const myPropRes = await API.get('/proposals/my-proposals');
          if (myPropRes.data.success) {
            const found = myPropRes.data.proposals.find(p => p.gig?._id === id);
            if (found) {
              setMyProposal(found);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Failed to retrieve project details.');
    } finally {
      setLoading(false);
    }
  };

  // Submit bid proposal (Freelancer)
  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const response = await API.post('/proposals', {
        gigId: id,
        description,
        bidAmount: Number(bidAmount),
        completionTime: Number(completionTime),
      });

      if (response.data.success) {
        setSuccess('Proposal submitted successfully!');
        setMyProposal(response.data.proposal);
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit proposal.');
    } finally {
      setActionLoading(false);
    }
  };

  // Accept Proposal (Client)
  const handleAcceptProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to accept this proposal? This will start the project and decline all other pending bids.')) return;
    
    setError('');
    setActionLoading(true);

    try {
      const response = await API.put(`/proposals/${proposalId}/status`, { status: 'accepted' });
      if (response.data.success) {
        setSuccess('Proposal accepted! Project is now in progress.');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update proposal status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Reject Proposal (Client)
  const handleRejectProposal = async (proposalId) => {
    if (!window.confirm('Are you sure you want to reject this proposal?')) return;
    setError('');
    setActionLoading(true);

    try {
      const response = await API.put(`/proposals/${proposalId}/status`, { status: 'rejected' });
      if (response.data.success) {
        setSuccess('Proposal rejected successfully.');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update proposal status.');
    } finally {
      setActionLoading(false);
    }
  };

  // Send Counter-Offer (Client)
  const handleSendCounterOffer = async (proposalId) => {
    if (!counterOfferVal || isNaN(counterOfferVal)) {
      setError('Please provide a valid counter-offer bid amount.');
      return;
    }
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const response = await API.put(`/proposals/${proposalId}/negotiate`, {
        counterOffer: Number(counterOfferVal)
      });
      if (response.data.success) {
        setSuccess('Counter-offer submitted to freelancer successfully!');
        setNegotiatingPropId(null);
        setCounterOfferVal('');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send counter-offer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Invite Freelancer (Client)
  const handleInviteFreelancer = async (freelancerId) => {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      const response = await API.post(`/gigs/${id}/invite`, { freelancerId });
      if (response.data.success) {
        setSuccess('Invitation sent successfully!');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send invitation.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenFreelancerProfile = async (freelancerId) => {
    setError('');
    setSuccess('');
    try {
      const res = await API.get(`/profile/freelancer/${freelancerId}`);
      if (res.data.success) {
        setSelectedFreelancer(res.data.profile);
        setShowFreelancerModal(true);
        const slots = res.data.profile.availabilitySlots || [];
        if (slots.length > 0) {
          setBookingDay(slots[0].day);
          setBookingSlot(`${slots[0].startHour} - ${slots[0].endHour}`);
        } else {
          setBookingDay('');
          setBookingSlot('');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Could not load freelancer profile.');
    }
  };

  const handleBookSlotSubmit = async (e) => {
    e.preventDefault();
    if (!bookingDay || !bookingSlot) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    setShowFreelancerModal(false);

    try {
      const res = await API.post(`/profile/freelancer/${selectedFreelancer.user?._id}/book`, {
        day: bookingDay,
        timeSlot: bookingSlot
      });

      if (res.data.success) {
        setSuccess('Consultation appointment booked successfully on freelancer calendar!');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      let revieweeId = '';
      if (user?.role === 'client') {
        const acceptedProp = proposals.find(p => p.status === 'accepted');
        revieweeId = acceptedProp ? acceptedProp.freelancer?._id : '';
      } else {
        revieweeId = gig.client?._id || gig.client;
      }

      if (!revieweeId) {
        setError('Counterparty freelancer/client not found for review.');
        return;
      }

      const res = await API.post('/reviews', {
        gigId: id,
        revieweeId,
        rating: Number(reviewRating),
        comment: reviewComment.trim()
      });

      if (res.data.success) {
        setSuccess('Thank you! Review and rating successfully submitted.');
        setHasSubmittedReview(true);
        setReviewComment('');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review.');
    } finally {
      setActionLoading(false);
    }
  };

  // Open Chat Room
  const handleInitiateChat = (counterpartId, counterpartName) => {
    const ids = [user?._id, counterpartId].sort();
    const roomId = `${ids[0]}_${ids[1]}`;
    navigate(`/chats?roomId=${roomId}&contactId=${counterpartId}&contactName=${encodeURIComponent(counterpartName)}`);
  };

  // Escrow Pay Checkout (Client)
  const handleOpenCheckout = (milestone) => {
    setCheckoutMilestone(milestone);
    setShowCheckoutModal(true);
  };

  const handleProcessCheckout = async (e) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvc) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    setShowCheckoutModal(false);

    try {
      const res = await API.post('/payments/checkout', {
        gigId: id,
        milestoneId: checkoutMilestone._id,
      });

      if (res.data.success) {
        setSuccess(`Milestone "${checkoutMilestone.title}" funded successfully! Locked in escrow.`);
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Escrow checkout failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Milestone Progress Actions (Freelancers & Clients)
  const handleMilestoneAction = async (milestoneId, newStatus) => {
    setError('');
    setSuccess('');
    setActionLoading(true);

    try {
      if (user?.role === 'client' && newStatus === 'approved') {
        const txRes = await API.get('/payments/history');
        const transaction = txRes.data.transactions.find(
          t => t.gig?._id === id && t.milestoneId === milestoneId && t.status === 'escrow_locked'
        );

        if (transaction) {
          await API.post('/payments/release', { transactionId: transaction._id });
        }
      }

      const res = await API.put(`/gigs/${id}/milestones/${milestoneId}`, { status: newStatus });
      if (res.data.success) {
        setSuccess(`Milestone progress updated: ${newStatus}`);
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Milestone update failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenDeliverModal = (milestoneId) => {
    setDeliverMilestoneId(milestoneId);
    setDeliverNotes('');
    setDeliverUrl('');
    setShowDeliverModal(true);
  };

  const handleDeliverSubmit = async (e) => {
    e.preventDefault();
    if (!deliverMilestoneId) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    setShowDeliverModal(false);

    try {
      const res = await API.put(`/gigs/${id}/milestones/${deliverMilestoneId}`, {
        status: 'completed',
        submissionNotes: deliverNotes,
        submissionUrl: deliverUrl
      });

      if (res.data.success) {
        setSuccess('Milestone deliverables submitted successfully! Client notified for review.');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Deliverable submission failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Raise Dispute Modal triggering
  const handleOpenDispute = (milestoneId) => {
    setDisputeMilestoneId(milestoneId);
    setShowDisputeModal(true);
  };

  const handleResolveDisputeSubmit = async (e) => {
    e.preventDefault();
    if (!disputeReason.trim()) return;

    setError('');
    setSuccess('');
    setActionLoading(true);
    setShowDisputeModal(false);

    try {
      const res = await API.post('/disputes', {
        gigId: id,
        milestoneId: disputeMilestoneId,
        reason: disputeReason.trim(),
      });

      if (res.data.success) {
        setSuccess('Dispute raised successfully! Administrators are reviewing the claim.');
        setDisputeReason('');
        loadGigData();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not file dispute.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="glass p-12 text-center rounded-3xl max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white">Gig Not Found</h3>
        <p className="text-gray-400 text-sm mt-1">This project does not exist or has been deleted.</p>
      </div>
    );
  }

  const isOwner = user?._id === gig.client?._id;

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => navigate('/gigs')}
          className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
        >
          ← Back to Marketplace
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-sm">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass p-6 md:p-8 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
            
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div className="space-y-2">
                <span className="text-[10px] text-indigo-400 font-semibold uppercase tracking-wider bg-indigo-950/40 border border-indigo-900/30 px-2.5 py-0.5 rounded-full inline-block">
                  {gig.category}
                </span>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">{gig.title}</h1>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1">
                  <span className="flex items-center gap-1"><User size={14} className="text-indigo-400" /> Posted by Client</span>
                  <span className="flex items-center gap-1"><MapPin size={14} className="text-indigo-400" /> {gig.location}</span>
                  <span className="flex items-center gap-1"><Calendar size={14} className="text-indigo-400" /> {new Date(gig.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="bg-indigo-950/20 border border-indigo-900/40 rounded-2xl p-4 shrink-0">
                <span className="block text-[10px] text-gray-500 uppercase tracking-widest font-semibold text-right">Project Budget</span>
                <span className="block text-2xl font-black text-emerald-400">${gig.budgetMin} - ${gig.budgetMax}</span>
                <span className="block text-[10px] font-semibold text-indigo-300 bg-indigo-950 border border-indigo-900/40 rounded px-2 py-0.5 mt-1.5 text-center uppercase tracking-wide">
                  Status: {gig.status}
                </span>
              </div>
            </div>

            <div className="space-y-2.5 border-t border-gray-800 pt-5">
              <h3 className="text-lg font-bold text-white">Project Description</h3>
              <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{gig.description}</p>
            </div>

            <div className="space-y-2.5 border-t border-gray-800 pt-5">
              <h3 className="text-sm font-bold text-white">Skills Required</h3>
              <div className="flex flex-wrap gap-2">
                {gig.skillsRequired.map((skill, idx) => (
                  <span key={idx} className="text-xs bg-gray-900 border border-gray-800 text-gray-300 py-1 px-3 rounded-lg font-medium">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {gig.attachments && gig.attachments.length > 0 && (
              <div className="space-y-2.5 border-t border-gray-800 pt-5">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <FileText size={15} className="text-indigo-400" />
                  Project Attachments
                </h3>
                <div className="space-y-2">
                  {gig.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline flex items-center gap-1 w-fit"
                    >
                      📎 {file.name || 'Project Specifications Brief'}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Escrow payment release logs */}
            <div className="space-y-3.5 border-t border-gray-800 pt-5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers size={18} className="text-indigo-400" />
                Project Progress & Milestone Escrows
              </h3>
              
              <div className="space-y-3">
                {gig.milestones.map((m, idx) => {
                  const isFunded = m.status !== 'pending';
                  const isCompleted = m.status === 'completed';
                  const isApproved = m.status === 'approved';

                  return (
                    <div key={m._id} className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 flex flex-col gap-3 relative overflow-hidden">
                      <div className="flex justify-between items-center gap-4 w-full">
                        <div className="space-y-1">
                          <span className="block text-[10px] text-gray-500 uppercase tracking-widest">Milestone {idx + 1}</span>
                          <h4 className="text-sm font-bold text-white">{m.title}</h4>
                          {m.description && <p className="text-xs text-gray-500">{m.description}</p>}
                        </div>
                        
                        <div className="text-right flex flex-col items-end gap-2 shrink-0">
                          <span className="text-sm font-extrabold text-emerald-400 block">${m.amount}</span>
                          
                          {/* Interactive triggers based on role */}
                          <div className="flex gap-2">
                            
                            {/* Client controls */}
                            {user?.role === 'client' && isOwner && (
                              <>
                                {m.status === 'pending' && gig.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCheckout(m)}
                                    className="text-[10px] font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded px-2.5 py-1 flex items-center gap-1 shadow cursor-pointer"
                                  >
                                    <CreditCard size={10} /> Fund Escrow
                                  </button>
                                )}
                                {m.status === 'completed' && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleMilestoneAction(m._id, 'approved')}
                                      className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2.5 py-1 cursor-pointer"
                                    >
                                      Approve & Release
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDispute(m._id)}
                                      className="text-[10px] font-bold bg-red-950/30 border border-red-900/40 text-red-400 hover:bg-red-900 hover:text-white rounded px-2.5 py-1 cursor-pointer"
                                    >
                                      Dispute
                                    </button>
                                  </>
                                )}
                              </>
                            )}

                            {/* Freelancer controls */}
                            {user?.role === 'freelancer' && myProposal?.status === 'accepted' && (
                              <>
                                {m.status === 'in_progress' && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeliverModal(m._id)}
                                    className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded px-2.5 py-1 cursor-pointer"
                                  >
                                    Submit Progress
                                  </button>
                                )}
                              </>
                            )}

                            {/* Static status display */}
                            {isApproved && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/20 border border-emerald-900/30 px-2 py-0.5 rounded">
                                Released
                              </span>
                            )}
                            {!isApproved && !isFunded && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-2 py-0.5 rounded">
                                Unfunded
                              </span>
                            )}
                            {m.status === 'in_progress' && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-950/20 border border-indigo-900/30 px-2 py-0.5 rounded">
                                Escrow Locked
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/20 border border-amber-900/30 px-2 py-0.5 rounded animate-pulse">
                                Pending Review
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Display Submitted Deliverables Work notes & URL if present */}
                      {m.submissionNotes && (
                        <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-900/35 text-xs space-y-1.5 text-left w-full mt-1">
                          <span className="block text-[10px] uppercase font-extrabold text-indigo-400">Freelancer Submitted Deliverables:</span>
                          <p className="text-gray-300 italic">{m.submissionNotes}</p>
                          {m.submissionUrl && (
                            <a
                              href={m.submissionUrl.startsWith('http') ? m.submissionUrl : `https://${m.submissionUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-indigo-400 hover:text-indigo-300 font-bold underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              <span>View / Download Deliverable Link</span>
                              <span className="text-[10px]">🔗</span>
                            </a>
                          )}
                          {m.submittedAt && (
                            <span className="block text-[9px] text-gray-500 mt-1">Submitted on: {new Date(m.submittedAt).toLocaleString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Project Feedback Rating & Reviews Panel */}
            {gig.status === 'completed' && !hasSubmittedReview && (
              <div className="glass p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden border border-indigo-500/10 mt-6">
                <div className="absolute -top-12 -right-12 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
                
                <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                  <Star className="text-amber-400 fill-amber-400" />
                  Leave Project Review Feedback
                </h2>
                
                <p className="text-xs text-gray-400 leading-relaxed">
                  Now that the gig is completed and funds are released, share your feedback review about the work collaboration.
                </p>

                <form onSubmit={handleReviewSubmit} className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Feedback Rating (1 to 5 Stars)</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                        >
                          <Star
                            size={24}
                            className={
                              star <= reviewRating
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-gray-600 hover:text-amber-500'
                            }
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-300">Comments & Review Remarks</label>
                    <textarea
                      required
                      rows={3}
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="e.g. Excellent communication, delivered code on schedule, highly recommended!"
                      className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-xs outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-3 px-4 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
                  >
                    Submit Review Feedback
                  </button>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Sidebar Interactions Panel */}
        <div className="space-y-6">
          
          {/* AI Skill Matching recommendations (For Client Owner) */}
          {user?.role === 'client' && isOwner && recommendations.length > 0 && (
            <div className="glass p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden border border-indigo-500/10">
              <div className="absolute -top-12 -right-12 w-20 h-20 bg-indigo-500/10 rounded-full blur-2xl"></div>
              
              <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <Sparkles size={20} className="text-indigo-400" />
                AI Smart Matches
              </h2>

              <div className="space-y-4">
                {recommendations.map((match) => (
                  <div key={match.profile._id} className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div>
                        <button
                          type="button"
                          onClick={() => handleOpenFreelancerProfile(match.profile.user?._id)}
                          className="block text-xs font-bold text-white hover:text-indigo-400 text-left truncate max-w-[130px] transition-colors cursor-pointer"
                        >
                          {match.profile.user?.name}
                        </button>
                        <span className="text-[10px] text-gray-500">Reputation: {match.reputationScore} ⭐</span>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                        {match.matchPercentage}% Match
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {match.profile.skills.slice(0, 3).map((s, i) => (
                        <span key={i} className="text-[8px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded">
                          {s.name}
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleInitiateChat(match.profile.user?._id, match.profile.user?.name)}
                        className="w-1/2 bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white text-xs font-semibold py-2 px-1.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <MessageSquare size={12} /> Chat
                      </button>
                      <button
                        type="button"
                        disabled={gig.invitedFreelancers?.includes(match.profile.user?._id)}
                        onClick={() => handleInviteFreelancer(match.profile.user?._id)}
                        className="w-1/2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:border-transparent text-white text-xs font-semibold py-2 px-1.5 rounded-xl transition-all cursor-pointer"
                      >
                        {gig.invitedFreelancers?.includes(match.profile.user?._id) ? 'Invited' : 'Invite'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Bids List view */}
          {user?.role === 'client' && isOwner && (
            <div className="glass p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <FileText size={20} className="text-indigo-400" />
                Received Bids ({proposals.length})
              </h2>

              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                {proposals.length === 0 ? (
                  <span className="text-xs text-gray-500 italic block text-center py-4">No bids submitted yet.</span>
                ) : (
                  proposals.map((prop) => (
                    <div key={prop._id} className="p-4 rounded-2xl bg-gray-950/40 border border-gray-900 space-y-3 relative group">
                      <div className="flex justify-between items-start">
                        <div>
                          <button
                            type="button"
                            onClick={() => handleOpenFreelancerProfile(prop.freelancer?._id)}
                            className="block text-sm font-bold text-white hover:text-indigo-400 text-left truncate max-w-[140px] transition-colors cursor-pointer"
                          >
                            {prop.freelancer?.name}
                          </button>
                          <span className="block text-[10px] text-gray-500">Reputation rating: 5.0 ⭐</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-sm font-extrabold text-emerald-400">${prop.bidAmount}</span>
                          <span className="block text-[9px] text-gray-500 flex items-center justify-end gap-0.5"><Clock size={10} /> {prop.completionTime} days</span>
                        </div>
                      </div>

                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed whitespace-pre-wrap">{prop.description}</p>
                      
                      <div className="flex flex-col gap-2 pt-2 border-t border-gray-900 w-full">
                        {gig.status === 'open' && (prop.status === 'pending' || prop.status === 'negotiating') ? (
                          <>
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => handleInitiateChat(prop.freelancer?._id, prop.freelancer?.name)}
                                className="w-1/3 bg-gray-900 border border-gray-800 hover:border-indigo-500/30 text-white text-[10px] font-semibold py-2 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <MessageSquare size={10} /> Chat
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAcceptProposal(prop._id)}
                                className="w-1/3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRejectProposal(prop._id)}
                                className="w-1/3 bg-red-950/20 border border-red-900/40 text-red-400 hover:bg-red-950 hover:text-red-300 text-[10px] font-semibold py-2 rounded-xl transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </div>
                            <div className="flex gap-2 w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  setNegotiatingPropId(negotiatingPropId === prop._id ? null : prop._id);
                                  setCounterOfferVal(prop.bidAmount);
                                }}
                                className="w-full bg-amber-950/20 border border-amber-900/40 text-amber-400 hover:bg-amber-950 hover:text-amber-300 text-[10px] font-semibold py-1.5 rounded-xl cursor-pointer"
                              >
                                {prop.status === 'negotiating' ? `Negotiating (Offer: $${prop.counterOffer})` : 'Negotiate Price'}
                              </button>
                            </div>
                          </>
                        ) : (
                          <span className={`w-full text-center text-xs font-bold uppercase tracking-wider py-2 rounded-xl ${
                            prop.status === 'accepted' ? 'bg-emerald-950/20 text-emerald-400' : 'bg-red-950/20 text-red-400'
                          }`}>
                            {prop.status}
                          </span>
                        )}
                      </div>

                      {negotiatingPropId === prop._id && (
                        <div className="space-y-2 p-3 bg-gray-950 rounded-xl border border-gray-800/60 mt-2">
                          <label className="text-[10px] text-gray-400 font-semibold block">Submit Counter-Offer Bid ($ USD)</label>
                          <div className="flex gap-2">
                            <input
                              type="number"
                              value={counterOfferVal}
                              onChange={(e) => setCounterOfferVal(e.target.value)}
                              className="w-2/3 bg-gray-900 border border-gray-800 text-xs py-1 px-2 text-white outline-none rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendCounterOffer(prop._id)}
                              className="w-1/3 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold py-1 rounded-lg cursor-pointer"
                            >
                              Send
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Freelancer Submit Bid view */}
          {user?.role === 'freelancer' && (
            <div className="glass p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden">
              <h2 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
                <FileText size={20} className="text-indigo-400" />
                Your Bid Proposal
              </h2>

              {myProposal ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-900 text-indigo-300 text-sm font-semibold flex items-center gap-3">
                    <CheckCircle size={18} />
                    You have applied to this gig!
                  </div>

                  <div className="space-y-3.5 text-sm p-4 rounded-2xl bg-gray-950/30 border border-gray-900">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Bid Amount:</span>
                      <span className="text-emerald-400 font-extrabold">${myProposal.bidAmount}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Delivery Time:</span>
                      <span className="text-white font-medium">{myProposal.completionTime} Days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Proposal Status:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        myProposal.status === 'accepted'
                          ? 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                          : myProposal.status === 'rejected'
                          ? 'bg-red-950/30 text-red-400 border border-red-900/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {myProposal.status}
                      </span>
                    </div>
                    <div className="space-y-1 pt-2 border-t border-gray-900">
                      <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider">Cover Letter</span>
                      <p className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{myProposal.description}</p>
                    </div>
                  </div>
                </div>
              ) : (
                gig.status !== 'open' ? (
                  <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800 text-amber-400 text-sm flex items-center gap-2 font-semibold">
                    <AlertTriangle size={18} />
                    Bidding closed for this gig.
                  </div>
                ) : (
                  <form onSubmit={handleProposalSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Bid Amount ($ USD)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 150"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Estimated Delivery Time (Days)</label>
                      <div className="relative">
                        <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={15} />
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="e.g. 5"
                          value={completionTime}
                          onChange={(e) => setCompletionTime(e.target.value)}
                          className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-300">Cover Letter</label>
                      <textarea
                        required
                        rows={4}
                        placeholder="Explain why you are the best fit for this project..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-gray-900/40 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-white text-xs outline-none resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                    >
                      {actionLoading ? 'Submitting Bid...' : 'Submit Proposal'}
                      <Send size={15} />
                    </button>
                  </form>
                )
              )}
            </div>
          )}

        </div>

      </div>

      {/* Checkout Modal overlay */}
      {showCheckoutModal && checkoutMilestone && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleProcessCheckout} className="glass p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2 border-b border-gray-800 pb-3">
              <CreditCard className="text-indigo-400" />
              Secure Escrow Payment
            </h3>
            
            <p className="text-xs text-gray-400 mb-5 pt-1">
              You are funding the milestone <strong>"{checkoutMilestone.title}"</strong>. The amount of <strong>${checkoutMilestone.amount}</strong> will be locked in escrow.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Card Number</label>
                <input
                  type="text"
                  required
                  maxLength="19"
                  placeholder="4111 2222 3333 4444"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim())}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    required
                    maxLength="5"
                    placeholder="12/28"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value.replace(/[^\d]/g, '').replace(/(.{2})/g, '$1/').replace(/\/$/, ''))}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-300">CVC</label>
                  <input
                    type="password"
                    required
                    maxLength="3"
                    placeholder="•••"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/[^\d]/g, ''))}
                    className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-4 border-t border-gray-950">
              <button
                type="button"
                onClick={() => setShowCheckoutModal(false)}
                className="w-1/2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-3 px-4 rounded-xl border border-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/30"
              >
                Pay ${checkoutMilestone.amount}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Dispute Modal overlay */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleResolveDisputeSubmit} className="glass p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in">
            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2 border-b border-gray-800 pb-3">
              <AlertTriangle className="text-red-400" />
              File a Dispute claim
            </h3>
            
            <p className="text-xs text-gray-400 mb-5 pt-1">
              Provide detail reasons for raising a dispute. An administrator will review your logs and mediate the fund resolution.
            </p>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-300">Detailed Complaint</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Explain why progress deliverables are incorrect or work remains incomplete..."
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-xs outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-6 mt-4 border-t border-gray-950">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="w-1/2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold py-3 px-4 rounded-xl border border-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-1/2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold py-3 px-4 rounded-xl"
              >
                File Dispute
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Freelancer Profile Details & Scheduling Modal */}
      {showFreelancerModal && selectedFreelancer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="glass p-6 md:p-8 rounded-3xl max-w-2xl w-full my-8 shadow-2xl relative animate-fade-in border border-indigo-500/10 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-start border-b border-gray-800 pb-4 mb-5">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  {selectedFreelancer.user?.name}
                  {selectedFreelancer.verificationBadge && (
                    <span className="text-[10px] bg-indigo-650/40 text-indigo-400 border border-indigo-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Verified
                    </span>
                  )}
                </h3>
                <p className="text-xs text-indigo-400 font-semibold mt-1">Hourly Rate: ${selectedFreelancer.hourlyRate}/hr | Status: {selectedFreelancer.availability}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowFreelancerModal(false)}
                className="text-gray-400 hover:text-white text-xl cursor-pointer"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {selectedFreelancer.bio && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">Biography</h4>
                  <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedFreelancer.bio}</p>
                </div>
              )}

              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">Skills & Proficiency</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFreelancer.skills.map((s, i) => (
                    <span key={i} className="text-xs bg-gray-900 border border-gray-800 text-gray-300 py-1 px-3 rounded-lg font-medium">
                      {s.name} ({s.level})
                    </span>
                  ))}
                </div>
              </div>

              {selectedFreelancer.experience && selectedFreelancer.experience.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">Work History</h4>
                  <div className="space-y-2">
                    {selectedFreelancer.experience.map((exp, i) => (
                      <div key={i} className="p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
                        <h5 className="text-xs font-bold text-white">{exp.title}</h5>
                        <p className="text-[10px] text-indigo-400 font-medium">{exp.company}</p>
                        {exp.description && <p className="text-[10px] text-gray-400 mt-1">{exp.description}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedFreelancer.portfolio && selectedFreelancer.portfolio.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider text-gray-400">Portfolio Gallery</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedFreelancer.portfolio.map((port, i) => (
                      <div key={i} className="p-3 bg-gray-950/40 border border-gray-900 rounded-xl">
                        <h5 className="text-xs font-bold text-white">{port.title}</h5>
                        {port.description && <p className="text-[10px] text-gray-400 mt-1">{port.description}</p>}
                        {port.link && (
                          <a href={port.link} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-400 underline block mt-2">
                            View Project Link
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-800 pt-5 mt-4 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Calendar size={16} className="text-indigo-400" />
                  Book consultation appointment
                </h4>
                
                {selectedFreelancer.availabilitySlots && selectedFreelancer.availabilitySlots.length > 0 ? (
                  <form onSubmit={handleBookSlotSubmit} className="p-4 bg-indigo-950/20 border border-indigo-900/40 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-semibold block">Select Day</label>
                        <select
                          value={bookingDay}
                          onChange={(e) => setBookingDay(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        >
                          {selectedFreelancer.availabilitySlots.map((slot, i) => (
                            <option key={i} value={slot.day}>{slot.day}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] text-gray-400 font-semibold block">Select Time Slot</label>
                        <select
                          value={bookingSlot}
                          onChange={(e) => setBookingSlot(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-850 focus:border-indigo-500 rounded-xl py-2 px-3 text-white text-xs outline-none"
                        >
                          {selectedFreelancer.availabilitySlots
                            .filter(slot => slot.day === bookingDay)
                            .map((slot, i) => (
                              <option key={i} value={`${slot.startHour} - ${slot.endHour}`}>
                                {slot.startHour} - {slot.endHour}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/30"
                    >
                      Confirm Booking Appointment
                    </button>
                  </form>
                ) : (
                  <p className="text-xs text-gray-500 italic">
                    This freelancer has not configured availability slots yet.
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-6 mt-6 border-t border-gray-800">
              <button
                type="button"
                onClick={() => setShowFreelancerModal(false)}
                className="bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-xs font-semibold py-2.5 px-5 rounded-xl cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Submit Deliverables Modal */}
      {showDeliverModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleDeliverSubmit} className="glass p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden animate-fade-in space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-gray-800 pb-3">
              <Send size={20} className="text-indigo-400" />
              Submit Milestone Deliverables
            </h3>

            <p className="text-xs text-gray-400">
              Provide project deliverable notes and a link to download or inspect your completed files (e.g. GitHub link, Figma link, Drive folder).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Deliverable Work URL / Link</label>
              <input
                type="text"
                required
                placeholder="e.g. https://github.com/myusername/project"
                value={deliverUrl}
                onChange={(e) => setDeliverUrl(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-xs outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Submission Notes / Summary</label>
              <textarea
                required
                rows={4}
                placeholder="Explain the work you completed for this milestone..."
                value={deliverNotes}
                onChange={(e) => setDeliverNotes(e.target.value)}
                className="w-full bg-gray-900/50 border border-gray-800 focus:border-indigo-500 rounded-xl py-2.5 px-4 text-white text-xs outline-none resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeliverModal(false)}
                className="w-1/2 bg-gray-900 border border-gray-800 hover:bg-gray-800 text-white text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-1/2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-3 px-4 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {actionLoading ? 'Submitting...' : 'Submit Work'}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default GigDetails;
