import http from "./http";

export interface SavePaymentReqDto {
  orderId: string;
  amount: number;
}

export interface PaymentConfirmReqDto {
  paymentKey: string;
  orderId: string;
  amount: number;
  reservationId: number;
}

export interface PaymentResDto {
  paymentKey: string;
  orderId: string;
  amount: number;
  status: string;
  approvedAt: string;
}

/**
 * 결제 정보 저장 (결제 요청 전)
 */
export async function savePayment(data: SavePaymentReqDto): Promise<void> {
  await http.post("/api/payments/save", data);
}

/**
 * 결제 승인 요청
 */
export async function confirmPayment(
  data: PaymentConfirmReqDto
): Promise<PaymentResDto> {
  const response = await http.post("/api/payments/confirm", data);
  return response.data;
}
