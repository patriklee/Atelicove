package com.atelicove.enums;

public enum  WorkOrderStatus {
	OPEN,
	IN_PROCESS,
	/** Legacy value retained only so existing persisted records can still be read. */
	@Deprecated
	ACTIVE,
	IN_REVIEW,
	COMPLETE
}
