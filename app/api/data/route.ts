import { connectDb } from "../../lib/mongodb";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const searchTerm = searchParams.get('search');
    
    if (!searchTerm) {
      return NextResponse.json([]);
    }
    
    const db = await connectDb();
    const collection = db.collection("medicare");
    
    const searchRegex = new RegExp(searchTerm, 'i');
    
    
    const numericMatch = searchTerm.match(/[\d,.]+/);
    let numericValue = null;
    let rangeType = 'exact'; 
    
    if (numericMatch) {
      numericValue = parseFloat(numericMatch[0].replace(/,/g, ''));
      
    
      if (searchTerm.toLowerCase().includes('k')) {
        numericValue *= 1000;
      } else if (searchTerm.toLowerCase().includes('m')) {
        numericValue *= 1000000;
      }
      
     
      if (searchTerm.includes('-') || searchTerm.toLowerCase().includes('to')) {
        rangeType = 'range';
      } else if (searchTerm.includes('<') || searchTerm.toLowerCase().includes('less than')) {
        rangeType = 'less';
      } else if (searchTerm.includes('>') || searchTerm.toLowerCase().includes('greater than')) {
        rangeType = 'greater';
      }
    }
    
    const isNumeric = numericValue !== null && !isNaN(numericValue) && numericValue > 0;
    
    const query: any = {
      $or: [
        { Place_of_Service: searchRegex },
        { Type_of_Service: searchRegex }
      ]
    };
    
    if (isNumeric) {
      if (rangeType === 'range') {
        const rangeMatch = searchTerm.match(/(\d+)[\s,-]+(\d+)/);
        if (rangeMatch) {
          const min = parseFloat(rangeMatch[1].replace(/,/g, ''));
          const max = parseFloat(rangeMatch[2].replace(/,/g, ''));
          
          const finalMin = searchTerm.toLowerCase().includes('k') ? min * 1000 : 
                          searchTerm.toLowerCase().includes('m') ? min * 1000000 : min;
          const finalMax = searchTerm.toLowerCase().includes('k') ? max * 1000 : 
                          searchTerm.toLowerCase().includes('m') ? max * 1000000 : max;
          
          query.$or.push({
            Allowed_Charges_Per_Person: {
              $gte: Math.min(finalMin, finalMax),
              $lte: Math.max(finalMin, finalMax)
            }
          });
        } else {
        
          const tolerance = numericValue * 0.5; 
          query.$or.push({
            Allowed_Charges_Per_Person: {
              $gte: numericValue - tolerance,
              $lte: numericValue + tolerance
            }
          });
        }
      } 
      else if (rangeType === 'less') {
        query.$or.push({
          Allowed_Charges_Per_Person: { $lte: numericValue }
        });
      }
      else if (rangeType === 'greater') {
        query.$or.push({
          Allowed_Charges_Per_Person: { $gte: numericValue }
        });
      }
      else {
        const tolerance = numericValue * 0.1; 
        query.$or.push({
          Allowed_Charges_Per_Person: {
            $gte: numericValue - tolerance,
            $lte: numericValue + tolerance
          }
        });
        
        query.$or.push({
          Allowed_Charges_Per_Person: numericValue
        });
      }
    }
    
    const data = await collection.find(query).limit(100).toArray();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}