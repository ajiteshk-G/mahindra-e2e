from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Depends
from app.schemas.catalog import VehicleItem, DealershipItem, VehicleComparisonRequest
from app.services.catalog_service import CatalogService

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from app.database import get_db
from app.models.dealership import Dealership

router = APIRouter(prefix="/catalog", tags=["Vehicle Catalog"])

@router.get("", response_model=List[VehicleItem])
async def list_vehicles(category: Optional[str] = None):
    vehicles = CatalogService.get_all_vehicles()
    if category:
        return [v for v in vehicles if v.category.lower() == category.lower()]
    return vehicles

@router.get("/dealerships", response_model=List[DealershipItem])
async def list_dealerships(city: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    stmt = select(Dealership).where(Dealership.is_active == True)
    if city:
        stmt = stmt.where(func.lower(Dealership.city) == city.lower())
    res = await db.execute(stmt)
    dealers = res.scalars().all()
    if dealers:
        return [
            DealershipItem(
                id=d.id,
                name=d.name,
                address=d.address,
                city=d.city,
                phone=d.phone,
                rating=d.rating or 4.8,
                available_advisors=d.available_advisors or ["Rajesh Varma"],
                has_test_drive_home_pickup=True
            )
            for d in dealers
        ]
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
