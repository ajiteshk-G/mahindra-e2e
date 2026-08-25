from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query
from app.schemas.catalog import VehicleItem, DealershipItem, VehicleComparisonRequest
from app.services.catalog_service import CatalogService

router = APIRouter(prefix="/catalog", tags=["Vehicle Catalog"])

@router.get("", response_model=List[VehicleItem])
async def list_vehicles(category: Optional[str] = None):
    vehicles = CatalogService.get_all_vehicles()
    if category:
        return [v for v in vehicles if v.category.lower() == category.lower()]
    return vehicles

@router.get("/dealerships", response_model=List[DealershipItem])
async def list_dealerships():
    return CatalogService.get_dealerships()

@router.get("/{vehicle_id}", response_model=VehicleItem)
async def get_vehicle(vehicle_id: str):
    vehicle = CatalogService.get_vehicle_by_id(vehicle_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return vehicle

@router.post("/compare", response_model=List[VehicleItem])
async def compare_vehicles(req: VehicleComparisonRequest):
    return CatalogService.compare_vehicles(req.vehicle_ids)
