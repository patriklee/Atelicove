package com.atelicove.entities;

import jakarta.persistence.*;

import com.atelicove.enums.ItemType;
import com.fasterxml.jackson.annotation.JsonIgnore;


@Entity
@Table(name = "work_order_item")
public class WorkOrderItem extends BaseEntity {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY) //AutoGenerates an ID
	private int workOrderItemID;
    
    @Column(nullable = false)
    private String itemName;

    @Column(nullable = false)
    private int quantity;

    @Column(nullable = false)
    private double price;
	
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ItemType itemType;
    
	@ManyToOne(optional = false)
	@JoinColumn(name = "work_order_id", nullable = false)
	@JsonIgnore
	private WorkOrder workOrder;

	public WorkOrderItem() {}

	public WorkOrderItem(String itemName, int quantity, double price, WorkOrder workOrder) {
		this(itemName, quantity, price, ItemType.OTHER, workOrder);
	}
	
	public WorkOrderItem(String itemName, int quantity, double price, ItemType itemType, WorkOrder workOrder) {
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
	public double getPrice() {
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

	public void setPrice(double price) {
		this.price = price;
	}
	
	public void setItemType(ItemType itemType) {
		this.itemType = itemType;
	}
	
	public void setWorkOrder(WorkOrder workOrder) {
		this.workOrder = workOrder;
	}
}
