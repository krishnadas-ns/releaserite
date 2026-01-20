"""
Release Endpoints Module
"""
from typing import List, Any
from uuid import UUID
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer

from app.core.database import get_db
from app.models.release import ReleaseModel, DeploymentModel, ReleaseServiceLinkModel
from app.models.service import ServiceModel # pylint: disable=unused-import
from app.models.environment import EnvironmentModel
from app.models.user import UserModel
from app.api.v1.dependencies import check_permission
from app.schemas.release import Release, ReleaseCreate, ReleaseUpdate, Deployment, DeploymentCreate

router = APIRouter()

@router.get("/", response_model=List[Release])
def list_releases(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("read:releases"))
) -> Any:
    """
    List all releases.
    """
    releases = db.query(ReleaseModel).offset(skip).limit(limit).all()
    return releases

@router.post("/", response_model=Release)
def create_release(
    release_in: ReleaseCreate,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> Any:
    """
    Create a new release.
    """
    # Create release object
    new_release = ReleaseModel(
        name=release_in.name,
        version=release_in.version,
        planned_release_date=release_in.planned_release_date,
        owner_id=_current_user.id,
        product_owner_id=release_in.product_owner_id,
        qa_id=release_in.qa_id,
        security_analyst_id=release_in.security_analyst_id,
    )

    db.add(new_release)
    db.commit() # Commit to get ID
    db.refresh(new_release)

    # Associate services via Link Table
    for link_data in release_in.services:
        link_obj = ReleaseServiceLinkModel(
            release_id=new_release.id,
            service_id=link_data.service_id,
            pipeline_link=link_data.pipeline_link,
            version=link_data.version
        )
        db.add(link_obj)

    db.commit()
    db.refresh(new_release)
    return new_release

@router.get("/{release_id}", response_model=Release)
def get_release(
    release_id: UUID,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("read:releases"))
) -> Any:
    """
    Get a specific release by ID.
    """
    release = db.query(ReleaseModel).filter(ReleaseModel.id == release_id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )
    return release

@router.patch("/{release_id}", response_model=Release)
def update_release(
    release_id: UUID,
    payload: ReleaseUpdate,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> Any:
    """
    Update release details.
    """
    release = db.query(ReleaseModel).filter(ReleaseModel.id == release_id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    data = payload.model_dump(exclude_unset=True)

    # Handle services if present
    if "services" in data:
        services_data = data.pop("services")
        # Remove existing links
        db.query(ReleaseServiceLinkModel)\
          .filter(ReleaseServiceLinkModel.release_id == release_id)\
          .delete()

        # Add new links
        for link_data in services_data:
             # link_data is a dict here since we dumped the model
            link_obj = ReleaseServiceLinkModel(
                release_id=release_id,
                service_id=link_data['service_id'],
                pipeline_link=link_data.get('pipeline_link'),
                version=link_data.get('version')
            )
            db.add(link_obj)

    for field, value in data.items():
        setattr(release, field, value)

    db.commit()
    db.refresh(release)
    return release

@router.post("/{release_id}/deploy", response_model=Deployment)
def deploy_release(
    release_id: UUID,
    deployment_in: DeploymentCreate,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> Any:
    """
    Record a deployment for a specific release to an environment.
    """
    release = db.query(ReleaseModel).filter(ReleaseModel.id == release_id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    # Create deployment record
    deployment = DeploymentModel(
        release_id=release_id,
        environment_id=deployment_in.environment_id,
        service_id=deployment_in.service_id,
        status=deployment_in.status
    )

    db.add(deployment)
    db.commit()
    db.refresh(deployment)
    return deployment


@router.delete("/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_release(
    release_id: UUID,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> None:
    """
    Delete a release.
    """
    release = db.query(ReleaseModel).filter(ReleaseModel.id == release_id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    # Cascade delete should handle children if configured, but let's be explicit if needed
    # ReleaseModel.service_links cascade="all, delete-orphan" handles links
    # DeploymentModel? Typically we want to remove them too.
    # DeploymentModel logic depends on how it's defined.
    # Let's check: DeploymentModel definition has `release = relationship(...)`
    # We didn't set cascade="all, deleted-orphan" on `ReleaseModel.deployments`.
    # So we should delete deployments first or ensure cascade is set.
    # For safety, let's manually delete deployments.

    db.query(DeploymentModel).filter(DeploymentModel.release_id == release_id).delete()
    db.delete(release)
    db.commit()


@router.delete(
    "/{release_id}/deploy/{environment_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def undeploy_release_from_environment(
    release_id: UUID,
    environment_id: UUID,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> None:
    """
    Remove (undeploy) a release from a specific environment (Admin only).
    """
    deployment = db.query(DeploymentModel).filter(
        DeploymentModel.release_id == release_id,
        DeploymentModel.environment_id == environment_id
    ).first()

    if not deployment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found",
        )

    db.delete(deployment)
    db.commit()


@router.delete(
    "/{release_id}/deploy/{environment_id}/{service_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def undeploy_service_from_environment(
    release_id: UUID,
    environment_id: UUID,
    service_id: UUID,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("create:releases"))
) -> None:
    """
    Remove (undeploy) a specific service from an environment for a release.
    Deletes ALL deployment records matching the criteria (handles duplicates).
    """
    # Delete all matching deployments (in case of duplicates)
    deleted_count = db.query(DeploymentModel).filter(
        DeploymentModel.release_id == release_id,
        DeploymentModel.environment_id == environment_id,
        DeploymentModel.service_id == service_id
    ).delete(synchronize_session=False)

    if deleted_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deployment not found for this service and environment",
        )

    db.commit()


@router.get("/{release_id}/report", response_class=StreamingResponse)
def generate_release_report(
    release_id: UUID,
    db: Session = Depends(get_db),
    _current_user: UserModel = Depends(check_permission("read:releases"))
):
    """
    Generate a PDF report for a release containing all details.
    """
    # pylint: disable=too-many-locals, too-many-statements
    release = db.query(ReleaseModel).filter(ReleaseModel.id == release_id).first()
    if not release:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Release not found",
        )

    # Get environments for deployment info
    environments = db.query(EnvironmentModel).all()

    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5*inch,
        bottomMargin=0.5*inch
    )
    styles = getSampleStyleSheet()
    elements = []

    # Title
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=20
    )
    elements.append(Paragraph(f"Release Report: {release.name}", title_style))
    elements.append(Spacer(1, 12))

    # Release Info Section
    elements.append(Paragraph("Release Information", styles['Heading2']))
    created_str = release.created_at.strftime("%Y-%m-%d %H:%M:%S") \
        if release.created_at else "—"
    planned_str = release.planned_release_date.strftime("%Y-%m-%d %H:%M:%S") \
        if release.planned_release_date else "—"

    release_info = [
        ["Field", "Value"],
        ["Release Name", release.name],
        ["Version", release.version],
        ["Created At", created_str],
        ["Planned Date", planned_str],
    ]

    t = Table(release_info, colWidths=[2*inch, 4*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Role Assignments Section
    elements.append(Paragraph("Role Assignments", styles['Heading2']))
    def get_user_name(user):
        if user:
            return user.full_name or user.email
        return "—"

    roles_data = [
        ["Role", "Assigned To"],
        ["Release Owner", get_user_name(release.owner)],
        ["Product Owner", get_user_name(release.product_owner)],
        ["QA Engineer", get_user_name(release.qa)],
        ["Security Analyst", get_user_name(release.security_analyst)],
    ]

    t2 = Table(roles_data, colWidths=[2*inch, 4*inch])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 20))

    # Services Section
    elements.append(Paragraph("Included Services", styles['Heading2']))
    services_data = [["Service Name", "Owner", "Version", "Pipeline Link"]]

    for link in release.service_links:
        services_data.append([
            link.service.name if link.service else "—",
            link.service.owner if link.service and link.service.owner else "—",
            link.version or "—",
            link.pipeline_link or "—"
        ])

    if len(services_data) > 1:
        t3 = Table(services_data, colWidths=[1.5*inch, 1.2*inch, 1*inch, 2.3*inch])
        t3.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t3)
    else:
        elements.append(Paragraph("No services included.", styles['Normal']))

    elements.append(Spacer(1, 20))

    # Deployment Status Section
    elements.append(Paragraph("Deployment Status", styles['Heading2']))

    # Build deployment matrix
    if release.service_links and environments:
        deploy_header = ["Service"] + [e.name for e in environments]
        deploy_data = [deploy_header]

        for link in release.service_links:
            row = [link.service.name if link.service else "—"]
            for env in environments:
                deployment = next(
                    (d for d in release.deployments
                     if str(d.environment_id) == str(env.id)
                     and str(d.service_id) == str(link.service_id)
                     and d.status == "success"),
                    None
                )
                if deployment:
                    row.append(deployment.deployed_at.strftime("%Y-%m-%d %H:%M"))
                else:
                    row.append("Not Deployed")
            deploy_data.append(row)

        col_widths = [1.5*inch] + [1.2*inch] * len(environments)
        t4 = Table(deploy_data, colWidths=col_widths)
        t4.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        elements.append(t4)
    else:
        elements.append(Paragraph("No deployment data available.", styles['Normal']))

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    # Return as downloadable file
    filename = f"release_report_{release.name.replace(' ', '_')}_{release.version}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
