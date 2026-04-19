import sys

file_path = r"d:\software_project\RoPa-Web-Service-V2\server\app\api\routers\owner.py"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update save_owner_section_draft
old_draft = """    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")

    scalar_fields = ["""
new_draft = """    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")

    # อัปเดตชื่อเอกสารหากมีการส่งมา
    doc = db.query(RopaDocumentModel).filter_by(id=document_id).first()
    if doc and payload.title:
        doc.title = payload.title

    scalar_fields = ["""

# 2. Update submit_owner_section
old_submit = """    if not section:
        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")

    scalar_fields = ["""
# Note: Since the string is the same, we need to be careful. 
# We'll use a more unique anchor for each if possible or use multiple replacements.
# Actually, the file has two occurrences. I will use a regex-based or manual index approach.

content_parts = content.split('if not section:\n        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")')

if len(content_parts) == 3:
    # First occurrence is draft, second is submit
    replacement = 'if not section:\n        raise HTTPException(status_code=404, detail="ไม่พบ Owner Section")\n\n    doc = db.query(RopaDocumentModel).filter_by(id=document_id).first()\n    if doc and payload.title:\n        doc.title = payload.title'
    content = content_parts[0] + replacement + content_parts[1] + replacement + content_parts[2]
else:
    print(f"Error: Expected 2 occurrences of section check, found {len(content_parts) - 1}")
    # Fallback to simple replace if split fails for some reason
    content = content.replace(old_draft, new_draft)

# 3. Update create_owner_snapshot (around line 503)
old_snapshot = """    doc = db.query(RopaDocumentModel).filter_by(id=id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")"""

new_snapshot = """    doc = db.query(RopaDocumentModel).filter_by(id=id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="ไม่พบเอกสาร")

    if payload.title:
        doc.title = payload.title"""

content = content.replace(old_snapshot, new_snapshot)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully updated owner.py")
