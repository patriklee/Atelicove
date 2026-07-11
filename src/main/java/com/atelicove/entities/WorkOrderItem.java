package com.atelicove.entities;

import java.math.BigDecimal;

import jakarta.persistence.*;

import com.atelicove.enums.ItemType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;


@Entity
@Table(name = "work_order_item")
public class WorkOrderItem extends BaseEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //AutoGenerates an ID
	@JsonProperty(access = JsonProperty.Access.READ_ONLY)
	private int workOrderItemID;
    
    @Column(nullable = false, length = 255)
    private String itemName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;
	
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType itemType;
    
	@ManyToOne(optional = false)
	@JoinColumn(name = "work_order_id", nullable = false)
	@JsonIgnore
	private WorkOrder workOrder;

	public WorkOrderItem() {}

	public WorkOrderItem(String itemName, int quantity, BigDecimal price, WorkOrder workOrder) {
		this(itemName, quantity, price, ItemType.OTHER, workOrder);
	}
	
	public WorkOrderItem(String itemName, int quantity, BigDecimal price, ItemType itemType, WorkOrder workOrder) {
		this.itemName = itemName;
		this.quantity = quantity;
		this.price = price;
		this.itemType = itemType;
		this.workOrder = workOrder;
	}
	
	public int getWorkOrderItemID() {
		return workOrderItemID;
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

	public WorkOrder getWorkOrder() {
		return workOrder;
	}

	public void setWorkOrderItemID(int WorkOrderItemID) {
		this.workOrderItemID = WorkOrderItemID;
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
	
	public void setWorkOrder(WorkOrder workOrder) {
		this.workOrder = workOrder;
	}
}
