package com.atelicove.entities;

import java.math.BigDecimal;

import com.atelicove.enums.ItemType;
import com.fasterxml.jackson.annotation.JsonIgnore;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "draft_work_order_item")
public class DraftWorkOrderItem extends BaseEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private int draftWorkOrderItemID;

	@Column(nullable = false, length = 255)
	private String itemName;

	@Column(nullable = false)
	private int quantity;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false)
	private ItemType itemType = ItemType.OTHER;

	@ManyToOne(optional = false)
	@JoinColumn(name = "draft_work_order_id", nullable = false)
	@JsonIgnore
	private DraftWorkOrder draftWorkOrder;

	public int getDraftWorkOrderItemID() {
		return draftWorkOrderItemID;
	}

	public String getItemName() {
		return itemName;
	}

	public int getQuantity() {
		return quantity;
	}

	public BigDecimal getPrice() {
		return price;
	}

	public ItemType getItemType() {
		return itemType;
	}

	public DraftWorkOrder getDraftWorkOrder() {
		return draftWorkOrder;
	}

	public void setDraftWorkOrderItemID(int draftWorkOrderItemID) {
		this.draftWorkOrderItemID = draftWorkOrderItemID;
	}

	public void setItemName(String itemName) {
		this.itemName = itemName;
	}

	public void setQuantity(int quantity) {
		this.quantity = quantity;
	}

	public void setPrice(BigDecimal price) {
		this.price = price;
	}

	public void setItemType(ItemType itemType) {
		this.itemType = itemType;
	}

	public void setDraftWorkOrder(DraftWorkOrder draftWorkOrder) {
		this.draftWorkOrder = draftWorkOrder;
	}
}
