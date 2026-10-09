-- EFRAN handshake. Dual-kernel payload for omega-certificate.
-- Scope: the printed card numerator only. Not a multiplication algorithm.
-- sorry is absent.

theorem beat_printed_card
    (card next : Int)
    (hcard : card = 826215307)
    (hnext : next = 826215308) :
    next ≥ card + 1 := by
  omega

theorem same_denominator_clears_card
    (den card next : Int)
    (hden : den = 20000000000000)
    (hcard : card = 826215307)
    (hnext : next = 826215308) :
    next * den ≥ card * den + den := by
  omega
